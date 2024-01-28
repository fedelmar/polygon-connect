import HDWalletProvider from '@truffle/hdwallet-provider'
import bn from 'bn.js'
import { POSClient, setProofApi, use } from '@maticnetwork/maticjs'
import { Web3ClientPlugin } from '@maticnetwork/maticjs-web3'
const config = require('../config')
const SCALING_FACTOR = new bn(10).pow(new bn(18))

use(Web3ClientPlugin)

if (config.proofApi) {
  setProofApi(config.proofApi)
}

const adminKey = config.admin.privateKey
const adminAddress = config.admin.address

const getPOSClient = () => {
  if (adminAddress && adminKey) {
    const posClient = new POSClient()
    return posClient.init({
      network: 'testnet',
      version: 'mumbai',
      parent: {
        provider: new HDWalletProvider(
          [adminKey],
          config.rpc.pos.parent,
        ),
        defaultConfig: {
          from: adminAddress,
        },
      },
      child: {
        provider: new HDWalletProvider(
          [adminKey],
          config.rpc.pos.child,
        ),
        defaultConfig: {
          from: adminAddress,
        },
      },
    })
  }
}

export { SCALING_FACTOR, getPOSClient, config, adminAddress }
