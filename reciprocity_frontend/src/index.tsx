import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";

ReactDOM.render(
  <React.StrictMode>
    <App
      friendsList={{
        foo: { checks: { hangOut: { me: true, them: true } }, bio: "foo bar" },
        foo2: {
          checks: { hangOut: { me: true, them: false } },
          bio: "foo bar",
        },
      }}
    />
  </React.StrictMode>,
  document.getElementById("root")
);

console.log("buck loves claire");
