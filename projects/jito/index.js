// const { PublicKey } = require("@solana/web3.js");
// const { getConnection } = require("../helper/solana");

// async function tvl() {
//   // https://jito.network/staking
//   const connection = getConnection();
//   const account = await connection.getAccountInfo(new PublicKey('Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb'))
//   return {
//     solana: Number(account.data.readBigUint64LE(258))/1e9
//   }
// }

// module.exports = {
//   timetravel: false,
//   methodology:
//     "Uses the SPL Stake Pool SDK to fetch the total supply of deposited SOL into the Jito Stake Pool",
//   solana: {
//     tvl,
//   },
// };

const { PublicKey } = require("@solana/web3.js");
const { sumTokens2, getConnection, decodeAccount, getAssociatedTokenAddress } = require("../helper/solana");
const { bs58 } = require('@project-serum/anchor/dist/cjs/utils/bytes');

const VAULT_PROGRAM_ID = new PublicKey("Vau1t6sLNxnzB7ZDsef8TLbPLfyZMYXH8WTNqUdm9g8");
const VAULT_DISCRIMINATOR = Buffer.from([2]);

function getVaultPubkey(vault) {
    const [associatedTokenAddress] = PublicKey.findProgramAddressSync([Buffer.from("vault"), vault.base.toBuffer()], VAULT_PROGRAM_ID);
    return associatedTokenAddress;
}

async function tvl() {
  const connection = getConnection();
  const accounts = await connection.getProgramAccounts(
    VAULT_PROGRAM_ID,
    {
      filters: [
        {
          memcmp: {
            offset: 0,
            bytes: bs58.encode(VAULT_DISCRIMINATOR),
          },
        },
      ]
    }
  );

  const vaults = accounts.map(i => decodeAccount('jitoVault', i.account))
  const stAssociatedTokenAddresses = vaults.map((vault) => {
    const vaultPubkey = getVaultPubkey(vault);
    return getAssociatedTokenAddress(vault.supportedMint, vaultPubkey);
  });

  return sumTokens2({ tokenAccounts: stAssociatedTokenAddresses, allowError: true })
}

module.exports = {
  timetravel: false,
  solana: {
    tvl,
  },
};