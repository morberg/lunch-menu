# Lunch Menu Scraper
<!-- See .github/copilot-instructions.md for development guidelines -->

This project is a web application that scrapes daily lunch menus from selected restaurants in Lund, Sweden. The application retrieves menu items and their prices, presenting them in a user-friendly format accessible via a web interface.

## Restaurants Included

- [Edison](https://restaurangedison.se/lunch/)
- [Brick's Eatery](https://brickseatery.se/lunch/)
- [Kantin](https://www.kantinlund.se/)
- [Gränden](https://grendenlund.se/lunch/)
- [Smakapåkina](https://smakapakina.se/lunch/)
- [Eatery](https://eatery.se/anlaggningar/lund)

## Project Structure

The project is organized as follows:

```
lunch-menu-scraper
├── src
│   ├── scrapers
│   │   ├── edison.ts       # Scraper for Edison restaurant
│   │   ├── bricks.ts       # Scraper for Brick's Eatery
│   │   ├── kantin.ts       # Scraper for Kantin
│   │   ├── grenden.ts      # Scraper for Gränden
│   │   ├── smakapakina.ts  # Scraper for Smakapåkina
│   │   └── eatery.ts       # Scraper for Eatery
│   ├── services
│   │   └── menu-service.ts # Caching service for menu data
│   ├── types
│   │   └── menu.ts         # Type definitions for menu items
│   ├── web
│   │   ├── app.ts          # Entry point for the web server
│   │   ├── routes
│   │   │   └── menus.ts     # Routes for accessing menu data
│   │   └── views
│   │       └── index.html   # HTML template for displaying menus
│   └── utils
│       ├── cache.ts        # In-memory cache with TTL support
│       └── price.ts        # Price parsing utilities
├── package.json             # npm configuration file
├── tsconfig.json            # TypeScript configuration file
└── README.md                # Project documentation
```

## Setup Instructions

1. **Run the application:**
   ```
   make start
   ```

2. **Access the web interface:**
   Open your web browser and navigate to `http://localhost:3000` to view the
   lunch menus locally.

## Performance & Caching

The application implements intelligent caching to provide fast response times:
- **Instant Response**: Menu data served from memory cache (~100ms)
- **Background Refresh**: Automatic updates every 2 hours
- **Reliability**: Serves cached data if external sites are temporarily down

See [CACHE_IMPLEMENTATION.md](CACHE_IMPLEMENTATION.md) for technical details.

## Makefile Commands

You can use the included Makefile for common tasks:

| Command            | Description                       |
| ------------------ | --------------------------------- |
| make install       | Install dependencies              |
| make build         | Build the project                 |
| make start         | Build and start the web server    |
| make test          | Run tests (if implemented)        |
| make clean         | Remove build and dependency files |
| make cache-status  | Check cache status                |
| make refresh-cache | Manually refresh menu cache       |
| make deploy        | Deploy the app to Vercel          |

All npm commands can still be used directly if preferred.

## Usage Guidelines

The application automatically serves cached menu data for optimal performance:
- **Fast Loading**: Menus load instantly from cache
- **Always Fresh**: Background updates ensure current information
- **Cache Management**: Use `make cache-status` and `make refresh-cache` as needed

## Deployment

The project can be deployed to Vercel using:

```
make deploy
```

View the deployed app at: https://lunch-menu-coral.vercel.app

## Technical Highlights

- **Smart Caching**: In-memory cache with TTL and background refresh
- **High Performance**: Sub-second response times vs previous 5-10 second delays  
- **Fault Tolerance**: Graceful degradation when external sites are unavailable
- **TypeScript**: Full type safety and modern development experience

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.