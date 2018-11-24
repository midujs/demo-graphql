const express = require('express');
const expressGraphQL = require('express-graphql');
const bodyParser = require('body-parser');
const { mergeSchemas } = require('graphql-tools');
const { Pool } = require('pg');

const { DB_HOST, DB_NAME, DB_PASS, DB_PORT, DB_USER } = require('./dbconfig');
const { graphile, mySchema, middlewares } = require('./utils');

const pgConfig = new Pool({
  host: DB_HOST,
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASS,
  port: DB_PORT,
});

const startServer = async () => {
  const forumSchema = await graphile.createPGQLSchema(pgConfig, ['forum_example']);

  const schema = mergeSchemas({
    schemas: [mySchema.schema, forumSchema],
    resolvers: [mySchema.resolver, {}],
  });

  const app = express();

  app.use(bodyParser.json());

  app.post('/graphql', middlewares.debugQuery);

  app.post(
    '/graphql',
    // Define how to resolve query
    // Fallback to "expressGraphQL"
    // TODO: dynamic check
    middlewares.proxy(async (query, name) => {
      const forumCase = ['allPeople', 'allPosts'].includes(name);
      return forumCase && graphile.performQuery(pgConfig)(forumSchema, query);
    }),
  );

  app.use('/graphql', expressGraphQL({ schema, graphiql: true }));

  app.listen(8080, () => console.log('Express with GraphQL Server now is running on http://localhost:8080/graphql'));
};

startServer()
  .then(() => {})
  .catch(e => console.error(e));
