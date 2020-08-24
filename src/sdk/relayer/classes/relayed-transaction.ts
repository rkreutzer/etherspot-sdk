import { Type } from 'class-transformer';
import { BigNumber } from 'ethers';
import { TransformBigNumber, WithTypename } from '../../common';
import { RelayedTransactionStates } from '../constants';

export class RelayedTransaction extends WithTypename {
  key: string;

  state: RelayedTransactionStates;

  hash: string;

  sender: string;

  account: string;

  encodedData: string;

  gasLimit: number;

  @TransformBigNumber()
  gasPrice: BigNumber;

  refundToken: string;

  @TransformBigNumber()
  refundAmount: BigNumber;

  @Type(() => Date)
  createdAt: Date;

  @Type(() => Date)
  updatedAt: Date;
}