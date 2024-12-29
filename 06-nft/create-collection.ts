import {Connection, LAMPORTS_PER_SOL, clusterApiUrl} from "@solana/web3.js";
import {airdropIfRequired, getExplorerLink, getKeypairFromFile} from "@solana-developers/helpers";
import {createUmi, } from "@metaplex-foundation/umi-bundle-defaults";
import {createNft, fetchDigitalAsset, mplTokenMetadata, } from "@metaplex-foundation/mpl-token-metadata";
import {generateSigner, keypairIdentity, percentAmount} from "@metaplex-foundation/umi";

const connection = new Connection(clusterApiUrl("devnet"));
const user = await getKeypairFromFile();
console.log("loaded user", user.publicKey.toBase58());
await airdropIfRequired(
     connection, user.publicKey, 1 * LAMPORTS_PER_SOL, 0.5 * LAMPORTS_PER_SOL);

// console.log("latest blockhash:", await connection.getLatestBlockhash());

// create an umi connection to devnet
const umi = createUmi(connection.rpcEndpoint);
umi.use(mplTokenMetadata());

const umiUser = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
umi.use(keypairIdentity(umiUser));

const collectionMint = generateSigner(umi);
const transaction = await createNft(umi, {
    name: "My Collection#1",
    symbol: "MC1",
    uri: "https://raw.githubusercontent.com/solana-developers/professional-education/main/labs/sample-nft-collection-offchain-data.json",
    mint: collectionMint,
    sellerFeeBasisPoints: percentAmount(0),
    isCollection: true,
});
await transaction.sendAndConfirm(umi);

const createdCollectionNft = await fetchDigitalAsset(
    umi,
    collectionMint.publicKey
);
const link = getExplorerLink(
    "address",
    createdCollectionNft.mint.publicKey,
    "devnet"
);
console.log(`Created Collection 📦! Address is ${link}`);
