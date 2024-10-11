import pika
import os
import logging


def main():
    rabbitUrl = os.environ.get("RABBITMQ_URL")
    if not rabbitUrl:
        logging.error("Missing env var 'RABBITMQ_URL'")
        exit(1)
    connectionParams = pika.URLParameters(rabbitUrl)
    connection = pika.BlockingConnection(connectionParams)
    channel = connection.channel()
    channel.queue_declare(queue="meelo", durable=True)

    def callback(ch, method, properties, body):
        logging.info(f"{body}")

    channel.basic_consume(queue="meelo", on_message_callback=callback)
    logging.basicConfig(level=logging.INFO)
    logging.info("Ready to match!")
    channel.start_consuming()


# From https://www.rabbitmq.com/tutorials/tutorial-one-python
if __name__ == "__main__":
    main()
