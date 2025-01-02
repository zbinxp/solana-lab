# how does the swap work?

## concepts

- PDA: program derived account controlled by some program
- ATA: associated token program, a special PDA, derived from (owner's address, mint's address, and token program id), used as a medium during a transfer
- Alice: the maker
- Bob: the taker
- token A: represented by a mint account, is a specific type of token, e.g. USD 
- token B: another token, e.g. EUR
- Alice's token A account: account is need to store the token, it's not a PDA
- Alice's token B account
- Bob's token A account
- Bob's token B account
- token program: the system program that manages token accounts
- offer: an offer identifies a swap, with a unique offer id
- offer account: a PDA, used to store the offer data
- vault: an ATA, derived from token id(in this case token A), offer account, and token program id. In this swap case, it's used as a medium

## explain the swap process

step 1: Alice wants to swap 10 token A with 15 token B, she makes an offer
step 2: Bob sees the offer, decides to take the offer

initial state:
- Alice's token A account: 10
- Alice's token B account: 0
- Bob's token A account: 0
- Bob's token B account: 15

fn make_offer:
  create vault account
  transfer 10 token A from Alice's token A account to the vault account, use CPI::invoke method, ?why not signer
  save the offer data into offer account

fn take_offer:
  transfer 15 token B from Bob's token B account to Alice's token B account, use CPI::invoke method
  transfer 10 token A from vault account to Bob's token A account, use CPI::invoke_signed method
  close the vault account

final state:
- Alice's token A account: 0
- Alice's token B account: 15
- Bob's token A account: 10
- Bob's token B account: 0

## why can Bob mutate the vault account?

As the vault account is a PDA controlled by token program, when you provide the seeds, you can mutate the account using CPI
