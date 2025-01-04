# vesting

I find that just following the [video on youtube](https://www.youtube.com/watch?v=amAq-WHAFs8) would not make your test cases compile. Changes need to be made about jest config and typescript config.

## steps 

1. create the project via `npx create-solana-dapp`
2. navigate to anchor folder, update `cargo.toml`, write your rust code in `lib.rs`, and use `anchor build` to compile your code. It works well
3. since we're using bankrun to make the test code simpler, we must install the packages: `solana-bankrun`, `anchor-bankrun`, and `spl-token-bankrun@0.2.5`(version matters, otherwise may cause conflicts).
4. initialize your jest config via `npx ts-jest config:init`, be sure to add `preset: 'ts-jest',`. This make jest cope with ts
5. copy the tsconfig*.json files in the root folder and the `anchor` folder
6. now write your test code inside the `tests` folder
7. run the test using either `npx jest` or `anchor test`

Good lunck!