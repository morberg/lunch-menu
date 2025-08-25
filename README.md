# Lunch Menu Scraper

This project is a web application that scrapes daily lunch menus from selected restaurants in Lund, Sweden. The application retrieves menu items and their prices, presenting them in a user-friendly format accessible via a web interface.

## Restaurants Included

- [Edison](https://restaurangedison.se/lunch/)
- [Brick's Eatery](https://brickseatery.se/lunch/)
- [Kantin](https://www.kantinlund.se/)
- [Gränden](https://grendenlund.se/lunch/)
- [Smakapåkina](https://smakapakina.se/lunch/)

## Project Structure

The project is organized as follows:

```
lunch-menu-scraper
├── src
│   ├── scrapers
│   │   ├── edison.ts       # Scraper for Edison restaurant
│   │   ├── bricks.ts       # Scraper for Brick's Eatery
│   │   └── kantin.ts       # Scraper for Kantin restaurant
│   ├── types
│   │   └── menu.ts         # Type definitions for menu items
│   ├── web
│   │   ├── app.ts          # Entry point for the web server
│   │   ├── routes
│   │   │   └── menus.ts     # Routes for accessing menu data
│   │   └── views
│   │       └── index.html   # HTML template for displaying menus
│   └── utils
│       └── parser.ts       # Utility functions for data parsing
├── package.json             # npm configuration file
├── tsconfig.json            # TypeScript configuration file
└── README.md                # Project documentation
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd lunch-menu-scraper
   ```


2. **Install dependencies:**
   ```
   make install
   ```

3. **Build the project:**
   ```
   make build
   ```

4. **Run the application:**
   ```
   make start
   ```

5. **Access the web interface:**
   Open your web browser and navigate to `http://localhost:3000` to view the lunch menus.

## Makefile Commands

You can use the included Makefile for common tasks:

| Command                | Description                       |
| ---------------------- | --------------------------------- |
| make install           | Install dependencies              |
| make build             | Build the project                 |
| make start             | Build and start the web server    |
| make test              | Run tests (if implemented)        |
| make clean             | Remove build and dependency files |
| make run-debug-edison  | Run Edison debug script           |
| make run-debug-bricks  | Run Bricks debug script           |
| make run-debug-kantin  | Run Kantin debug script           |
| make run-debug-grenden | Run Grenden debug script          |
| make deploy            | Deploy the app to Vercel          |

All npm commands can still be used directly if preferred.

## Usage Guidelines

## Deployment

The project can be deployed to Vercel using:

```
make deploy
```

View the deployed app at: https://lunch-menu-coral.vercel.app

- The application will automatically scrape the lunch menus from the specified restaurants each time it is accessed.
- Menu items will be displayed in a structured format, including the name of the dish and its price.
- The web interface is designed to be mobile-friendly for easy access on smartphones.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.