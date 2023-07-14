async function connect(amqp){
    let connection;
    console.log('amqp', amqp.connect)

    await amqp.connect('amqp://rabbitmq')
    .then((_connection) => {console.log('Connected to rabbitmq'); connection = _connection})
    .catch((error) => console.error('Error connecting to rabbitmq:', error));
    
    return connection;
    }
  
async function createChannel(connection){
    let channel;
    connection.createChannel()
    .then((_channel) => {console.log('createChannel to rabbitmq'); channel = _channel})
    .catch((error) => console.error('Error createChannel to rabbitmq:', error));
    return channel;
}

async function consumeFromQueue(channel, queueName, callback) {
    await channel.consume(queueName, callback, { noAck: true });
}

async function declareQueue(channel, queueName) {
    await channel.assertQueue(queueName);
}

async function publishToQueue(channel, queueName, message){
    try{
      await channel.sendToQueue(queueName, Buffer.from(message));
      console.log('Task published to the queue.');
    }catch(err){
      console.error(`failed to update for ${queueName} and task: ${message}` + err)
    }
}

module.exports = {declareQueue, connect,consumeFromQueue, createChannel};
