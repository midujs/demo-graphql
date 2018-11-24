const express = require("express");
const expressGraphQL = require("express-graphql");
const bodyParser = require("body-parser");
const { buildSchema, GraphQLSchema } = require("graphql");
const { Pool } = require("pg");
const { graphql } = require("graphql");
const { mergeSchemas, makeExecutableSchema } = require("graphql-tools");
const {
  withPostGraphileContext,
  createPostGraphileSchema,
  createPostGraphQLSchema
} = require("postgraphile");

const { coursesData } = require("./data");
const { DB_HOST, DB_NAME, DB_PASS, DB_PORT, DB_USER } = require("./dbconfig");
const pgConfig = new Pool({
  host: DB_HOST,
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASS,
  port: DB_PORT
});

const mySchema = buildSchema(`
  type Query {
    message: String
    course(id: Int!): Course
    courses(topic: String): [Course]
  }

  type Course {
    id: Int
    title: String
    author: String
    description: String
    topic: String
    url: String
  }
`);

const getCourse = args => {
  const { id } = args;
  return coursesData.find(c => c.id === id);
};

const getCourses = args => {
  const { topic } = args;
  if (!topic) return coursesData;
  return coursesData.filter(c => c.topic === topic);
};

const rootValue = {
  message: () => "Hello World!",
  course: getCourse,
  courses: getCourses,
  allPeople: () => "all people"
};

const createSchema = async () => {
  const schema = await createPostGraphQLSchema(pgConfig, ["forum_example"]);
  console.log("[createSchema] > schema: ", schema);
  // const s = new GraphQLSchema(schema);
  return schema;
};

const delay = time => new Promise(resolve => setTimeout(resolve, time));

const startServer = async () => {
  const graphileSchema = await createPostGraphQLSchema(pgConfig, [
    "forum_example"
  ]);
  // const graphileSchema = await createSchema();
  // console.log('[startServer] > mySchema: ', mySchema);
  // console.log('[startServer] > graphileSchema: ', graphileSchema);
  const schema = mergeSchemas({
    schemas: [graphileSchema, mySchema],
    resolvers: {}
  });
  const app = express();
  app.use(bodyParser.json());

  const performQuery = async (
    schema,
    query,
    variables,
    jwtToken = null,
    operationName
  ) => {
    return await withPostGraphileContext(
      {
        pgPool: pgConfig,
        jwtToken,
        jwtSecret: null,
        pgDefaultRole: null
      },
      async context => {
        // Execute your GraphQL query in this function with the provided
        // `context` object, which should NOT be used outside of this
        // function.
        return await graphql(
          schema, // The schema from `createPostGraphileSchema`
          query,
          null,
          { ...context }, // You can add more to context if you like
          variables,
          operationName
        );
      }
    );
  };

  let myContext = null;

  withPostGraphileContext(
    {
      pgPool: pgConfig,
      jwtToken: null,
      jwtSecret: null,
      pgDefaultRole: null
    },
    async context => {
      await delay(3 * 1000);
      myContext = context;
    }
  );

  app.use((_, res, next) => {
    if (!myContext) {
      res.send("Waiting for myContext");
      return;
    }

    next();
  });

  app.post("/graphql", async (req, res) => {
    console.log("[Go into custom POST]");
    const { query } = req.body;
    const data = await performQuery(graphileSchema, query);
    // const data = await performQuery(schema, query);
    res.json(data);
  });

  app.use("/graphql", expressGraphQL({ schema, graphiql: true }));

  app.listen(8080, () =>
    console.log(
      "Express with GraphQL Server now is running on http://localhost:8080/graphql"
    )
  );
};

startServer()
  .then(() => {})
  .catch(e => console.error(e));
