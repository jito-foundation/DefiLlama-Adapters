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