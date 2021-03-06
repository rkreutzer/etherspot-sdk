import { Sdk, sleep } from '../../src';
import { logger, topUpAccount, randomAddress, randomWallet } from './common';

async function main(): Promise<void> {
  const ownerWallet = randomWallet();
  const externalWallet = randomWallet();

  logger.log('owner wallet', ownerWallet.address);
  logger.log('external wallet', externalWallet.address);

  await topUpAccount(ownerWallet.address, '0.5');
  await topUpAccount(externalWallet.address, '0.5');

  const sdk = new Sdk(ownerWallet);

  logger.log(
    'contract account',
    await sdk.computeContractAccount({
      sync: false,
    }),
  );

  {
    logger.info('sending batch using owner wallet');

    logger.log(
      'owner wallet batch #1',
      await sdk.batchAddAccountOwner({
        owner: randomAddress(),
      }),
    );
    logger.log(
      'owner wallet batch #2',
      await sdk.batchAddAccountOwner({
        owner: randomAddress(),
      }),
    );

    const transactionRequest = await sdk.encodeGatewayBatch();

    logger.log('transaction request', transactionRequest);

    const transactionResponse = await ownerWallet.sendTransaction(transactionRequest);

    logger.log('transaction response', transactionResponse);
    logger.log('transaction', await transactionResponse.wait());
  }

  {
    logger.info('sending batch using external wallet');

    logger.log(
      'batch #1',
      await sdk.batchAddAccountOwner({
        owner: randomAddress(),
      }),
    );
    logger.log(
      'batch #2',
      await sdk.batchAddAccountOwner({
        owner: randomAddress(),
      }),
    );

    const transactionRequest = await sdk.encodeGatewayBatch({
      delegate: true, // use delegate for external wallets
    });

    logger.log('transaction request', transactionRequest);

    const transactionResponse = await externalWallet.sendTransaction(transactionRequest);

    logger.log('transaction response', transactionResponse);
    logger.log('transaction', await transactionResponse.wait());
  }

  {
    logger.info('sending batch using gateway');

    await topUpAccount(sdk.state.accountAddress, '0.5');

    logger.log(
      'batch #1',
      await sdk.batchAddAccountOwner({
        owner: randomAddress(),
      }),
    );
    logger.log(
      'batch #2',
      await sdk.batchAddAccountOwner({
        owner: randomAddress(),
      }),
    );

    logger.log('estimated batch', await sdk.estimateGatewayBatch());

    const submittedBatch = await sdk.submitGatewayBatch();

    const { hash } = submittedBatch;

    await sleep(5);

    logger.log(
      'submitted batch',
      await sdk.getGatewaySubmittedBatch({
        hash,
      }),
    );
  }
}

main()
  .catch(logger.error)
  .finally(() => process.exit());
