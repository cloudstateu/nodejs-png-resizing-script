# Images resizing script
This script is responsible for resizing exsisting images stored in the Azure Blob Storage.

## Run script form cli
### Prerequisites
 - nodejs `v17.5.0`
### Instructions
**Warning: Transfer costs may be high if you run this script on your local machine**
 - Create `.env` file form `.env.example` and pass here your blob storage connection string
 - Run `npm i` command to install all necessary dependencies
 - Run `node index.js` and wait until the script completes its job

## Run using container
### Prerequisites
 - Docker
### Instructions
**Warning: Transfer costs may be high if you run this script on your local machine**
 - Build a new image using the following command
    ```bash
        docker build -t <repository-name>/imagecompression:<version> .
    ```
 - Run your container (using cli method)
    ```bash
        docker run \
            -e DESIRED_WIDTH='<IMAGE_DESIRED_WIDTH>' \
            -e CONNECTION_STRING='<BLOB_CONNECTION_STRING>' \
            --rm <repository-name>/imagecompression:<version>
    ```
