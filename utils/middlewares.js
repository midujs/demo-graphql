const log = console.log;
const gql = require('graphql-tag');

const debugQuery = (req, _, next) => {
  const devEnv = process.env.NODE_ENV === 'development';
  const query = req.body.query;
  true && query && log('[query]', query);

  next();
};

const proxy = callback => async (req, res, next) => {
  if (!req.body.query) {
    next();
    return;
  }

  const queryStr = req.body.query;
  const query = gql(req.body.query);
  const operation = query.definitions[0].operation;
  const queryName = query.definitions[0].selectionSet.selections[0].name.value;

  console.log('[operation]', operation);
  console.log('[queryName]', queryName);

  const data = await callback(queryStr, queryName);

  if (data) {
    res.json(data);
    return;
  }

  next();
};

module.exports = {
  debugQuery,
  proxy,
};
