# WEkonnet API

> Backend API for WEkonnet application. This project is aimed at providing a platform for alumni of a particular organization to maintain the connection they have as time goes on; by providing detailed and updated info about one another.

## Usage

Rename "config/config.env.example" to "config/config.env" and update the values of the enviroment variables

## Install Dependencies

```
npm install
```

## Run App

```
# Development mode
npm run dev

# Production mode
npm start
```

## Database Seeder

To seed the database with admins, members, and organizations with data from the "\_data" folder, run

```
# Destroy all data
node seeder -d

# Import all data
node seeder -i
```

- Version: 1.0.0
- License: MIT
- Author: Quzeem Agbaje
