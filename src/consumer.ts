import amqp from 'amqplib';
import dotenv from 'dotenv';
dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
/**
 * Establishes a connection to a RabbitMQ server.
 *
 * @returns {Promise<amqp.Connection | undefined>} A promise that resolves to 
 * the RabbitMQ connection object if successful, or undefined if an error occurs.
 */
export const createMQConnection = async (): Promise<amqp.Connection | undefined> => {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        console.log('Connected to RabbitMQ');
        return connection;
    } catch (error) {
        console.error('Error connecting to RabbitMQ:', error);
    }
}

/**
 * Closes the RabbitMQ connection, shutting down all channels and releasing
 * all server resources allocated to the connection.
 *
 * @param {amqp.Connection} connection - The RabbitMQ connection object.
 * @returns {Promise<void>} A promise that resolves when the connection is
 * closed, or rejects with an error if an error occurs during shutdown.
 */
export const closeMQConnection = async (connection: amqp.Connection): Promise<void> => {
    try {
        await connection.close();
        console.log('Closed RabbitMQ connection');
    } catch (error) {
        console.error('Error closing RabbitMQ connection:', error);
    }
}

/**
 * Creates a RabbitMQ channel, a lightweight connection to the RabbitMQ server
 * that handles the sending and receiving of messages.
 *
 * @param {amqp.Connection} connection - The RabbitMQ connection object.
 * @returns {Promise<amqp.Channel | undefined>} A promise that resolves to the
 * RabbitMQ channel object if successful, or undefined if an error occurs.
 */
export const createChannel = async (connection: amqp.Connection): Promise<amqp.Channel | undefined> => {
    try {
        const channel = await connection.createChannel();
        console.log('Created RabbitMQ channel');
        return channel;
    } catch (error) {
        console.error('Error creating RabbitMQ channel:', error);
    }
}

/**
 * Closes a RabbitMQ channel, a lightweight connection to the RabbitMQ server
 * that handles the sending and receiving of messages.
 *
 * @param {amqp.Channel} channel - The RabbitMQ channel object.
 * @returns {Promise<void>} A promise that resolves when the channel is closed,
 * or rejects with an error if an error occurs during shutdown.
 */
export const closeChannel = async (channel: amqp.Channel): Promise<void> => {
    try {
        await channel.close();
        console.log('Closed RabbitMQ channel');
    } catch (error) {
        console.error('Error closing RabbitMQ channel:', error);
    }
}

/**
 * Consumes a message from a RabbitMQ queue.
 *
 * @param {amqp.Channel} channel - The RabbitMQ channel object.
 * @param {string} queueName - The name of the RabbitMQ queue to consume from.
 *
 * @returns {Promise<void>} A promise that resolves when a message is consumed
 * from the queue, or rejects with an error if an error occurs during consumption.
 */

export const consumeMessage = async (channel: amqp.Channel, queueName: string): Promise<void> => {
    try {
        await channel.assertQueue(queueName);
        console.log(`Waiting for messages in queue: ${queueName}`);

        // Set up consumer for messages
        await channel.consume(queueName, (message) => {
            if (message) {
                const content = message.content.toString();
                console.log('Received message from RabbitMQ queue:');
                console.log(content);
                // channel.ack(message);
            }
        }, { noAck: false });
    } catch (error) {
        console.error('Error consuming message from RabbitMQ queue:', error);
    }
}

/**
 * Main function to run the consumer. Keeps the connection and channel alive
 * to continuously consume messages from the queue.
 */
const runConsumer = async () => {
    const connection = await createMQConnection();
    if (!connection) return;

    const channel = await createChannel(connection);
    if (!channel) return;

    try {
        await consumeMessage(channel, 'send_email_queue');

        process.on('SIGINT', async () => {
            console.log('Gracefully shutting down...');
            await closeChannel(channel);
            await closeMQConnection(connection);
            process.exit(0);
        });
    } catch (error) {
        console.error('Error in consumer:', error);
    }
}

// Run the consumer
runConsumer();
