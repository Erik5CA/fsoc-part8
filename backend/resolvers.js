const { GraphQLError } = require("graphql");
const { PubSub } = require("graphql-subscriptions");
const pubsub = new PubSub();
const Author = require("./models/author");
const Book = require("./models/book");
const User = require("./models/user");
const jwt = require("jsonwebtoken");

const resolvers = {
  Query: {
    authorCount: () => Author.collection.countDocuments(),
    bookCount: () => Book.collection.countDocuments(),
    allBooks: async (root, args) => {
      if (!args.author && !args.genre) {
        return Book.find({}).populate("author", { name: 1 });
      }
      const author = await Author.find({ name: args.author });
      if (!args.genre) {
        return Book.find({ author: author[0].id }).populate("author", {
          name: 1,
        });
      }
      if (!args.author) {
        return Book.find({ genres: args.genre }).populate("author", {
          name: 1,
        });
      }
      return Book.find({ author: author[0].id, genres: args.genre }).populate(
        "author",
        { name: 1 }
      );
    },
    allAuthors: async () => {
      return Author.find({});
    },
    me: (root, args, context) => {
      return context.currentUser;
    },
  },
  Author: {
    bookCount: async (root) => {
      const books = await Book.find({ author: root.id });
      return books.length;
    },
  },
  Mutation: {
    addBook: async (root, args, context) => {
      const currentUser = context.currentUser;

      if (!currentUser) {
        throw new GraphQLError("not authenticated", {
          extensions: {
            code: "BAD_USER_INPUT",
          },
        });
      }
      let authorId;
      const author = await Author.find({ name: args.author });
      if (author.length === 0) {
        const newAuthor = new Author({ name: args.author });
        let newAuthorSave;
        try {
          newAuthorSave = await newAuthor.save();
        } catch (error) {
          throw new GraphQLError("Add book failed", {
            extensions: {
              code: "BAD_USER_INPUT",
              invalidArgs: args.author,
              error,
            },
          });
        }
        authorId = newAuthorSave;
      } else {
        authorId = author[0];
      }
      const book = new Book({ ...args, author: authorId });
      try {
        await book.save();
      } catch (error) {
        throw new GraphQLError("Add book failed", {
          extensions: {
            code: "BAD_USER_INPUT",
            invalidArgs: args.title,
            error,
          },
        });
      }
      pubsub.publish("BOOK_ADDED", { bookAdded: book });
      return book;
    },
    editAuthor: async (root, args, context) => {
      const currentUser = context.currentUser;

      if (!currentUser) {
        throw new GraphQLError("not authenticated", {
          extensions: {
            code: "BAD_USER_INPUT",
          },
        });
      }
      const authorFound = await Author.find({ name: args.name });
      if (authorFound.length === 0) {
        return null;
      }
      const authorToUpdate = { name: args.name, born: args.setBornTo };

      const authorUpdated = await Author.findByIdAndUpdate(
        authorFound[0].id,
        authorToUpdate,
        { new: true }
      );
      return authorUpdated;
    },
    createUser: async (root, args) => {
      const user = new User({ ...args });
      try {
        await user.save();
      } catch (error) {
        throw new GraphQLError("Creating the user failed", {
          extensions: {
            code: "BAD_USER_INPUT",
            invalidArgs: args.username,
            error,
          },
        });
      }
      return user;
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username });

      if (!user || args.password !== "secret") {
        throw new GraphQLError("wrong credentials", {
          extensions: {
            code: "BAD_USER_INPUT",
          },
        });
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      };

      return { value: jwt.sign(userForToken, process.env.JWT_SECRET) };
    },
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator("BOOK_ADDED"),
    },
  },
};

module.exports = resolvers;
