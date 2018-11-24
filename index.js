const express = require('express');
const expressGraphQL = require('express-graphql');
const { buildSchema, GraphQLSchema } = require('graphql');
const { Pool } = require('pg');
const { mergeSchemas, makeExecutableSchema } = require('graphql-tools');
const {
  withPostGraphileContext,
  createPostGraphileSchema,
  createPostGraphQLSchema
} = require('postgraphile');

const { coursesData } = require('./data');
const { DB_HOST, DB_NAME, DB_PASS, DB_PORT, DB_USER } = require('./dbconfig');
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
  message: () => 'Hello World!',
  course: getCourse,
  courses: getCourses
};

const createSchema = async () => {
  const schema = await createPostGraphQLSchema(pgConfig, ['forum_example']);
  console.log('[createSchema] > schema: ', schema);
  // const s = new GraphQLSchema(schema);
  return schema;
};

const startServer = async () => {
  const graphileSchema = await createPostGraphQLSchema(pgConfig, [
    'forum_example'
  ]);
  // const graphileSchema = await createSchema();
  // console.log('[startServer] > mySchema: ', mySchema);
  // console.log('[startServer] > graphileSchema: ', graphileSchema);
  const schema = mergeSchemas({ schemas: [graphileSchema, mySchema] });
  const app = express();
  app.use('/graphql', expressGraphQL({ schema, rootValue, graphiql: true }));

  app.listen(8080, () =>
    console.log(
      'Express with GraphQL Server now is running on http://localhost:8080/graphql'
    )
  );
};

startServer()
  .then(() => {})
  .catch(e => console.error(e));
