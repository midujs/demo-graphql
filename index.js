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
  const schemas = [mySchema.schema, forumSchema];

  const schema = mergeSchemas({
    schemas,
    resolvers: [mySchema.resolver, {}],
  });

  const app = express();

  Object.keys(
    forumSchema //
      .getQueryType()
      .getFields(),
  ) //
    .map(field => {
      const r = forumSchema.getQueryType().getFields()[field].resolve;
      schema.getQueryType().getFields()[field].resolve = r;
    });

  app.use(bodyParser.json());

  app.post(
    '/graphql',
    // Define how to resolve query
    // Fallback to "expressGraphQL"
    middlewares.proxy((query, name) => {
      const matched = schemas
        .map(schema => {
          const field = schema.getQueryType().getFields()[name];
          const hasResolve = field && field.resolve;
          return hasResolve && schema;
        })
        .filter(Boolean)[0];
      return matched && graphile.performQuery(pgConfig)(matched, query);
    }),
  );

  app.use('/graphql', expressGraphQL({ schema, graphiql: true }));

  app.listen(8080, () => console.log('Express with GraphQL Server now is running on http://localhost:8080/graphql'));
};

startServer()
  .then(() => {})
  .catch(e => console.error(e));
