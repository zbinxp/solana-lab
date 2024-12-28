# how to create a token

## create a keypair for the mint authority
 
1. create token mint account
create an account to use as our mint authority, which is also as the freeze authority and metadata update authority.

```shell
# make 1 keypair where the public key starts with `bos`, as you add more letters, it will take longer to generate the key.
solana-keygen grind --starts-with bos:1
```

2. Configure the Solana CLI to use to use the keypair 

```shell
solana config set --keypair bosqBYpv7oykL9VHeAS5NBXoVmFBKedNbpCAHsqBGUw.json
```

3. set the Solana CLI to use devnet: `solana config set --url devnet`

4. get some sol via [airdrop](https://faucet.solana.com/), check the balance: `solana balance`

## Make a mint address

```shell
solana-keygen grind --starts-with mnt:1
```

## Create the token 

1. determine the minor units (e.g. cents for USD, wei for ETH)

2. create the token mint, using the Token Extension Program(TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb)

```shell
spl-token create-token --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb --enable-metadata --decimals 9 mntTvc2wV5n5oLc7BdjNU9wEG9U2xaXDXR9QgsCA2fz.json 
```

3. create metadata.json

```json
{
  "name": "Example Token",
  "symbol": "EXMPL",
  "description": "Example token from Solana Making a Token guide.",
  "image": "https://raw.githubusercontent.com/solana-developers/opos-asset/main/assets/CompressedCoil/image.png"
}
```

4. add metadata to the token

```shell
spl-token initialize-metadata mntTvc2wV5n5oLc7BdjNU9wEG9U2xaXDXR9QgsCA2fz 'Example Token' 'EXMPL' https://raw.github
usercontent.com/solana-developers/opos-asset/main/assets/CompressedCoil/metadata.json
```

Congratulations, you created a token with metadata!


## Mint tokens

1. create account for our token mint address. Token accounts are required to hold SPL tokens of a specific type. Each type of token needs its own account (one-to-one relation). The mint address(mntTvc2wV5n5oLc7BdjNU9wEG9U2xaXDXR9QgsCA2fz) represents the unique identifier of the token.

```shell
spl-token create-account mntTvc2wV5n5oLc7BdjNU9wEG9U2xaXDXR9QgsCA2fz

# output: Creating account RSWMJR52aLHSiCSUfwWEH2TRkg5sSu85Xuc1rF6mQU5
```

2. mint 1000 tokens 

```shell
spl-token mint mntTvc2wV5n5oLc7BdjNU9wEG9U2xaXDXR9QgsCA2fz 1000

# output
Minting 1000 tokens
  Token: mntTvc2wV5n5oLc7BdjNU9wEG9U2xaXDXR9QgsCA2fz
  Recipient: RSWMJR52aLHSiCSUfwWEH2TRkg5sSu85Xuc1rF6mQU5
```

3. check explorer.solana.com for the tokens, search for `RSWMJR52aLHSiCSUfwWEH2TRkg5sSu85Xuc1rF6mQU5`

4. transfer the token to another address

```shell
spl-token transfer mntTvc2wV5n5oLc7BdjNU9wEG9U2xaXDXR9QgsCA2fz 10 (recipient wallet address) --fund-recipient
```