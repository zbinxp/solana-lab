# crud-app

## Getting Started

### Prerequisites

- Node v18.18.0 or higher
- Rust v1.77.2 or higher
- Anchor CLI 0.30.1 or higher
- Solana CLI 1.18.17 or higher

```shell
# build and test
cd anchor
anchor build
anchor test # there's an error in `delete test case`, don't know why

# start local validator
solana-test-validator

# make keys sync
anchor keys sync

# then deploy to local
anchor deploy --provider.cluster localnet

# start web UI
cd ../src
npm run dev
```