# NFT lab

## create nft collection

```shell
npx esrun create-collection.ts
```

make sure you set the keypair before `solana config set --keypair file.json`

![NFT Collection](./create-collection.png)

## create nft

```shell
# remember to update nft-collection address 
npx esrun create-nft.ts
```

![Create NFT](./create-nft.png)

## verify the NFT 

```shell
# remember to update the nft address first
npx esrun verify-nft.ts
```

![Verify NFT](./verify-nft.png)