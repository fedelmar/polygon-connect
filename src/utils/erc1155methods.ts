import { POSClient } from "@maticnetwork/maticjs"
import { Web3BaseWalletAccount } from "web3"

const config = require('../config')
const adminAddress = config.admin.address

export const transferERC1155 = async (
  client: POSClient,
  accountsCreated: Web3BaseWalletAccount[],
) => {
  if (client && adminAddress && accountsCreated.length > 0) {
    const newAccountAddress = accountsCreated[0].address // Obtén la dirección de la nueva cuenta creada

    const erc1155Token = client.erc1155(config.pos.child.erc1155)

    // Asegúrate de que `amount` y `tokenId` estén configurados según tus requisitos
    const amount = 0.1
    const tokenId = '123'

    try {
      const transferResult = await erc1155Token.transfer({
        amount,
        tokenId,
        from: adminAddress,
        to: newAccountAddress,
      })

      const txHash = await transferResult.getTransactionHash()
      console.log('Transfer TxHash: ', txHash)

      const txReceipt = await transferResult.getReceipt()
      console.log('Transfer TxReceipt: ', txReceipt)
    } catch (error) {
      console.error('Error transferring MATIC:', error)
    }
  }
}

export const getERC155Balance = async (
  client: any,
  accountsCreated: any[],
) => {
  if (client && adminAddress) {
    const erc1155Token = client.erc1155(config.pos.child.erc1155)
    const balance = await erc1155Token.getBalance(adminAddress, '123')
    console.log('Admin balance: ', balance)
    if (accountsCreated.length > 0) {
      const balance = await erc1155Token.getBalance(
        accountsCreated[0].address,
        '123',
      )
    }
  }
}
