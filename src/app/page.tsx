'use client'
declare global {
  interface Window {
    ethereum?: any
  }
}
import { useEffect, useState } from 'react'
import { Button } from '../components/ui/button'
import Web3, { Web3BaseWalletAccount } from 'web3'
import { POSClient, use } from '@maticnetwork/maticjs'
import { Web3ClientPlugin } from '@maticnetwork/maticjs-web3'
import { getPOSClient, adminAddress } from '../utils/utils_pos'
import { getERC155Balance, transferERC1155 } from '@/utils/erc1155methods'

// install web3 plugin
use(Web3ClientPlugin)

const mumbaiNetwork = {
  chainId: '0x13881',
  chainName: 'Polygon Testnet Mumbai',
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  rpcUrls: [
    'https://rpc-mumbai.maticvigil.com',
    'https://polygon-mumbai-bor.publicnode.com',
    'wss://polygon-mumbai-bor.publicnode.com',
    'https://polygon-mumbai.gateway.tenderly.co',
    'wss://polygon-mumbai.gateway.tenderly.co',
  ],
  blockExplorerUrls: ['https://mumbai.polygonscan.com'],
}

const Home = () => {
  const [chainId, setChainId] = useState<string>('')
  const [accounts, setAccounts] = useState<string[]>([])
  const [adminBalance, setAdminBalance] = useState<string>('')
  const [accountsCreated, setAccountCreated] = useState<
    Web3BaseWalletAccount[]
  >([])
  const [loadingTx, setLoadingTx] = useState<boolean>(false)
  const [balances, setBalances] = useState<
    { address: string; balance: string }[]
  >([])
  const [loading, setLoading] = useState<boolean>(true)
  const [client, setClient] = useState<POSClient>()

  const switchToMumbaiNetwork = async () => {
    try {
      const newChainId = await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [mumbaiNetwork],
      })

      setChainId(newChainId)
    } catch (error) {
      console.log(error)
    }
  }

  const networkChanged = (chainId: string) => {
    console.log('Network changed: ', { chainId })
    setChainId(chainId)
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.ethereum) {
        window.ethereum.on('chainChanged', networkChanged)

        return () => {
          window.ethereum.removeListener('chainChanged', networkChanged)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (chainId !== '' && chainId !== '0x13881') {
      switchToMumbaiNetwork()
    }
  }, [chainId])

  useEffect(() => {
    const connect = async () => {
      const web3 = new Web3(window.ethereum)
      const accounts = await web3.eth.getAccounts()
      setAccounts(accounts)

      const chainId = await web3.eth.getChainId()
      console.log('Chain Id: ', `0x${Number(chainId).toString(16)}`)
      setChainId(`0x${Number(chainId).toString(16)}`)

      if (accounts.length > 0) {
        const balance = await web3.eth.getBalance(accounts[0])
        // Convertir el saldo de wei a Matic
        const balanceMatic = web3.utils.fromWei(balance, 'ether')
        setAdminBalance(balanceMatic.toString())
      }

      const posClient = await getPOSClient()

      if (posClient) setClient(posClient)
    }

    setLoading(true)
    connect()
    setLoading(false)
  }, [])

  useEffect(() => {
    const getBalances = async () => {
      if (accountsCreated.length > 0) {
        const web3 = new Web3(window.ethereum)
        const updatedBalances = [...balances]

        for (const account of accountsCreated) {
          const balance = await web3.eth.getBalance(account.address)
          const balanceMatic = web3.utils.fromWei(balance, 'ether')
          const existingIndex = updatedBalances.findIndex(
            (item) => item.address === account.address,
          )

          if (existingIndex !== -1) {
            updatedBalances[existingIndex].balance = balanceMatic.toString()
          } else {
            updatedBalances.push({
              address: account.address,
              balance: balanceMatic.toString(),
            })
          }
        }
        setBalances(updatedBalances)

        const aBalance = await web3.eth.getBalance(accounts[0])
        const aBalanceMatic = web3.utils.fromWei(aBalance, 'ether')
        setAdminBalance(aBalanceMatic)
      }
    }

    getBalances()
  }, [loadingTx, accountsCreated])

  if (loading)
    return (
      <div className='flex flex-col items-center p-6  justify-between'>
        Loading...
      </div>
    )

  const connectWallet = async () => {
    if (typeof window !== 'undefined') {
      if (window.ethereum) {
        setLoading(true)
        const web3 = new Web3(window.ethereum)

        try {
          const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts',
          })
          setAccounts(accounts)

          const balance = await web3.eth.getBalance(accounts[0])
          // Convertir el saldo de wei a Matic
          const balanceMatic = web3.utils.fromWei(balance, 'ether')
          setAdminBalance(balanceMatic.toString())

          const chainId = await web3.eth.getChainId()
          console.log('Chain Id: ', `0x${Number(chainId).toString(16)}`)
          setChainId(`0x${Number(chainId).toString(16)}`)
        } catch (error) {
          console.error(error)
        }
        setLoading(false)
      } else {
        console.error(
          'Web3 no detectado. Asegúrate de que MetaMask esté instalado.',
        )
      }
    }
  }

  const sendMaticToAccount = async (
    web3: Web3,
    account: Web3BaseWalletAccount,
  ) => {
    setLoadingTx(true)
    const transferTxHash = await web3.eth.sendTransaction({
      from: accounts[0],
      to: account.address,
      value: web3.utils.toWei('0.01', 'ether'),
    })
    console.log('Transferencia exitosa. TxHash: ', transferTxHash)
    setLoadingTx(false)
  }

  const createNewAccount = async () => {
    if (typeof window !== 'undefined') {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum)

        try {
          // Crear nueva cuenta
          const newAccount = await web3.eth.accounts.wallet.create(1)
          const createdAccount = newAccount[0]

          // Agregar la nueva cuenta a la lista
          setAccountCreated([...accountsCreated, createdAccount])
          console.log('NewAccount: ', createdAccount)

          await sendMaticToAccount(web3, newAccount[0])
        } catch (error) {
          console.error(error)
        }
      } else {
        console.error(
          'Web3 no detectado. Asegúrate de que MetaMask esté instalado.',
        )
      }
    }
  }

  return (
    <div className='flex min-h-screen flex-col items-center p-24'>
      <div className='flex flex-col items-center p-6 w-auto h-auto bg-gray-300 rounded-lg shadow-lg justify-between'>
        {accounts.length === 0 ? (
          <Button className='w-auto' onClick={() => connectWallet()}>
            Connect Wallet to Metamask
          </Button>
        ) : (
          <div className='flex flex-col'>
            <p>Accounts connected: </p>
            <div className='flex flex-col'>
              {accounts.map((account: string) => {
                return <div key={account}>{account}</div>
              })}
            </div>
            <p>Admin Balance: {adminBalance} </p>
            <div className='m-2'>
              {chainId !== mumbaiNetwork.chainId && (
                <p className='text-red-600 font-bold mt-2'>
                  Cambie a la red de Polygon Tesnet Mumbai para operar
                </p>
              )}
            </div>
            {accountsCreated.length > 0 && (
              <div className='flex flex-col'>
                <p>Accounts created: </p>
                <div className='flex flex-col'>
                  {accountsCreated.map((account: Web3BaseWalletAccount) => {
                    return (
                      <div key={account.address}>
                        {account.address} Balance:{' '}
                        {
                          balances.find((b) => b.address === account.address)
                            ?.balance
                        }
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {accountsCreated.length < 10 && (
              <div className='mt-2 items-center'>
                <Button onClick={() => createNewAccount()}>
                  Create new Account
                </Button>
              </div>
            )}
          </div>
        )}

        {/*  {client && (
          <div>
            {
              <div className='mt-2 items-center'>
                <p>Transfer from adminAccount to first new account</p>
                <Button
                  onClick={() => transferERC1155(client, accountsCreated)}
                >
                  Transfer
                </Button>
              </div>
            }

            <div className='mt-2 items-center'>
              <Button onClick={() => getERC155Balance(client, accountsCreated)}>
                Get balance
              </Button>
            </div>
          </div>
        )} */}
      </div>
    </div>
  )
}

export default Home
