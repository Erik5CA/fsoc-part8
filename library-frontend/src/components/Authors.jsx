import { useMutation, useQuery } from "@apollo/client";
import { ALL_AUTHORS, EDIT_AUTHOR } from "../queries";
import { useState } from "react";
import Select from "react-select";

const Authors = (props) => {
  const [name, setName] = useState(null);
  const [year, setYear] = useState("");
  const result = useQuery(ALL_AUTHORS);

  const [updateAuthor] = useMutation(EDIT_AUTHOR, {
    refetchQueries: [{ query: ALL_AUTHORS }],
  });

  if (!props.show) {
    return null;
  }

  if (result.loading) {
    return <div>loading...</div>;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    updateAuthor({
      variables: { name: name.value, setBornTo: parseInt(year) },
    });
    setYear("");
  };
  const authors = result.data?.allAuthors;

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>born</th>
            <th>books</th>
          </tr>
          {authors?.map((a) => (
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {props.token && (
        <>
          <h2>Set Birthyear</h2>
          <form onSubmit={handleSubmit}>
            <div>
              <Select
                defaultValue={name}
                onChange={setName}
                options={authors.map((author) => {
                  return {
                    value: author.name,
                    label: author.name,
                  };
                })}
              />
            </div>
            <div>
              year{" "}
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
            <button>Update Author</button>
          </form>
        </>
      )}
    </div>
  );
};

export default Authors;
