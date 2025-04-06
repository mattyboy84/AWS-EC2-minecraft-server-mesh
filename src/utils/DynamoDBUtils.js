const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocument } = require('@aws-sdk/lib-dynamodb');


async function updateItem(params) {
  const { tableName, key, updates, region } = params;
  const client = new DynamoDBClient({ region: region || 'eu-west-2' });
  const ddbDocClient = DynamoDBDocument.from(client);

  const updateExpressionParts = [];
  const expressionAttributeValues = {};

  Object.keys(updates).forEach((field, index) => {
    const expressionAttributeName = `#attr${index}`;
    const expressionAttributeValue = `:val${index}`;
    updateExpressionParts.push(`${expressionAttributeName} = ${expressionAttributeValue}`);
    expressionAttributeValues[expressionAttributeValue] = updates[field];
  });

  const updateExpression = `SET ${updateExpressionParts.join(', ')}`;
  const expressionAttributeNames = Object.keys(updates).reduce((acc, field, index) => {
    const expressionAttributeName = `#attr${index}`;
    acc[expressionAttributeName] = field;
    return acc;
  }, {});

  const result = await ddbDocClient.update({
    TableName: tableName,
    Key: key,
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  });

  return result.Attributes || {};
}

async function query(params) {
  const {
    tableName,
    expressionAttributeValues,
    keyConditionExpression,
    region,
    limit,
    returnConsumedCapacity = 'TOTAL',
    select = 'ALL_ATTRIBUTES',
    indexName = undefined,
  } = params;
  const client = new DynamoDBClient({ region: region || 'eu-west-2' });
  const ddbDocClient = DynamoDBDocument.from(client);

  const result = await ddbDocClient.query({
    TableName: tableName,
    ExpressionAttributeValues: expressionAttributeValues,
    KeyConditionExpression: keyConditionExpression,
    Limit: limit,
    ReturnConsumedCapacity: returnConsumedCapacity,
    Select: select,
    IndexName: indexName || undefined,
  });

  return result;
}

async function getItem(params) {
  const { tableName, key, region, endpoint } = params;

  let client = null;

  if (!endpoint) {
    client = new DynamoDBClient({ region: region || 'eu-west-2' });
  } else {
    client = new DAXClient({ region: region || 'eu-west-2', endpoint: endpoint });
  }


  const ddbDocClient = new DynamoDBDocument({ service: client })

  const result = await ddbDocClient.get({
    TableName: tableName,
    Key: key,
  });

}

async function putItem(params) {
  const { tableName, item, region } = params;
  const client = new DynamoDBClient({ region: region || 'eu-west-2' });
  const ddbDocClient = DynamoDBDocument.from(client);

  console.log({
    TableName: tableName,
    Item: item,
  });
  const result = await ddbDocClient.put({
    TableName: tableName,
    Item: item,
  });
  return result.$metadata.httpStatusCode;
}

async function deleteItem(params) {
  const { tableName, key, region } = params;
  const client = new DynamoDBClient({ region: region || 'eu-west-2' });
  const ddbDocClient = DynamoDBDocument.from(client);

  const result = await ddbDocClient.delete({
    TableName: tableName,
    Key: key,
  });
  return result.$metadata.httpStatusCode;
}

async function scan(params) {
  const {
    tableName,
    select = 'ALL_ATTRIBUTES',
    limit = 1000,
    region,
  } = params;
  const client = new DynamoDBClient({ region: region || 'eu-west-2' });
  const ddbDocClient = DynamoDBDocument.from(client);

  const result = await ddbDocClient.scan({
    TableName: tableName,
    Select: select,
    Limit: limit,
  });
  return result.Items || [];
}

module.exports = {
  getItem,
  updateItem,
  putItem,
  deleteItem,
  scan,
  query,
};
