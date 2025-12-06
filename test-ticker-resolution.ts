import { FinancialDataService } from './src/services/financial-data';

async function testTickerResolution() {
  // Read API key from environment variable
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    console.error(
      'Error: No Alpha Vantage API key found. Set ALPHA_VANTAGE_API_KEY environment variable.'
    );
    process.exit(1);
  }

  const service = new FinancialDataService(apiKey);

  console.log('Testing ticker symbol resolution...\n');

  // Test 1: Valid ticker symbol
  console.log('Test 1: Testing with valid ticker "AAPL"');
  try {
    const result1 = await service.resolveTickerSymbol('AAPL');
    console.log(
      `✅ Result: ${result1.symbol} - ${result1.name} (isResolved: ${result1.isResolved})\n`
    );
  } catch (error) {
    console.error(`❌ Error: ${error}\n`);
  }

  // Test 2: Company name
  console.log('Test 2: Testing with company name "MASTERCARD"');
  try {
    const result2 = await service.resolveTickerSymbol('MASTERCARD');
    console.log(
      `✅ Result: ${result2.symbol} - ${result2.name} (isResolved: ${result2.isResolved})\n`
    );
  } catch (error) {
    console.error(`❌ Error: ${error}\n`);
  }

  // Test 3: Another company name
  console.log('Test 3: Testing with company name "Microsoft"');
  try {
    const result3 = await service.resolveTickerSymbol('Microsoft');
    console.log(
      `✅ Result: ${result3.symbol} - ${result3.name} (isResolved: ${result3.isResolved})\n`
    );
  } catch (error) {
    console.error(`❌ Error: ${error}\n`);
  }

  console.log('All tests completed!');
}

testTickerResolution();
