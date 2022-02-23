# Images resizing script
This script is responsible for resizing exsisting images stored in the Azure Blob Storage.

## Images path regular expressions
 - Use `*` to math all files in current directory
 - Use `**` to math everything in current and children directory

### Example
#### Test case
 - `/container/**/test/*`  
#### Would match:
 - `/container/1/2/3/test/image.png`
 - `/container/3/test/image.png`
#### Would not match:
 - `/container/1/2/3/image.png` 
 - `/container/1/test/test2/image.png` 

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
            -e IMAGES_PATH='<IMAGES_PATH>' \
            -e CONNECTION_STRING='<BLOB_CONNECTION_STRING>' \
            --rm <repository-name>/imagecompression:<version>
    ```

## Run using container instances on Azure cloud
### Pre deployment (run only once):
Modify parameters in the [pre-deployment.azcli](pre-deployment.azcli) file:  
| param name | description |
|-----|-----------|
| `resourceGroupName` | specifies the resource group where ACR should be deployed
| `location` | specifies the Azure region where solution would be deployed |
| ``
