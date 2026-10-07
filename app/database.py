import os

import psycopg2


def get_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
        dbname=os.getenv("DB_NAME", "image_server"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "postgres"),
    )


def create_table():
    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS images (
                    id SERIAL PRIMARY KEY,
                    filename VARCHAR(255) NOT NULL,
                    original_name VARCHAR(255) NOT NULL,
                    size INTEGER NOT NULL,
                    upload_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    file_type VARCHAR(20) NOT NULL
                )
                """
            )

        connection.commit()
    finally:
        connection.close()