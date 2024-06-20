import { useQuery } from "@apollo/client";
import { ALL_BOOKS, USER } from "../queries";

export const Recommend = (props) => {
  const resultUSer = useQuery(USER);

  const result = useQuery(ALL_BOOKS);
  if (!props.show) {
    return null;
  }
  if (resultUSer.loading || result.loading) {
    return <div>loading...</div>;
  }

  const user = resultUSer?.data?.me;
  console.log({ user });
  const books = result.data.allBooks;
  const bookUserPrefer = books.filter((book) =>
    book.genres.includes(user?.favoriteGenre)
  );
  return (
    <div>
      <h2>Recommendations</h2>

      <p>
        Books in your favorite genre <b>pattern</b> {user?.favoriteGenre}
      </p>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {bookUserPrefer?.map((a) => (
            <tr key={a?.title}>
              <td>{a?.title}</td>
              <td>{a?.author.name}</td>
              <td>{a?.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
