# Test Fixtures

This directory contains saved HTML files used for integration testing.

## Why Use Fixtures?

Instead of testing against live websites (which can change and break tests), we save a snapshot of the HTML content and test our parsers against that known, stable data.

## Files

- `bricks-lunch-page.html` - Saved copy of the Bricks Eatery lunch page
- `edison-lunch-page.html` - Saved copy of the Edison restaurant lunch page  
- `kantin-page.html` - Saved copy of the Kantin Lund homepage
- `grenden-page.html` - Saved copy of the Grenden restaurant page
- `smakapakina-page.html` - Saved copy of the Smakapakina menu page

## How to Update Fixtures

When website structures change significantly, you can update the fixtures:

```bash
curl -s "https://brickseatery.se/lunch/" > src/test/fixtures/bricks-lunch-page.html
curl -s "https://restaurangedison.se/lunch/" > src/test/fixtures/edison-lunch-page.html
curl -s "https://www.kantinlund.se/" > src/test/fixtures/kantin-page.html
curl -s "https://lund.pieplowsmat.se/grenden/" > src/test/fixtures/grenden-page.html
curl -s "https://www.smakapakina.se/meny" > src/test/fixtures/smakapakina-page.html
```

Then run the integration tests to make sure they still pass:

```bash
make test
```

## Benefits

✅ Tests are reliable and repeatable  
✅ Tests don't depend on external websites being available  
✅ Tests won't break when restaurants update their content  
✅ We can test edge cases by modifying fixtures  
✅ Tests run faster (no network requests)
