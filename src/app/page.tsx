'use client'
declare global {
  interface Window {
    ethereum?: any
  }
}

import { useEffect, useState } from 'react'
import { Button } from '../components/ui/button'
import Web3, { Web3BaseWalletAccount } from 'web3'

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
  const [userAddress, setUserAddres] = useState<string>('')
  const [chainId, setChainId] = useState<string>('')
  const [accounts, setAccounts] = useState<string[]>([])
  const [accountsCreated, setAccountCreated] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)

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
    window.ethereum.on('chainChanged', networkChanged)

    return () => {
      window.ethereum.removeListener('chainChanged', networkChanged)
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
    }

    setLoading(true)
    connect()
    setLoading(false)
  }, [])

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

          const userAddress = accounts[0]
          setUserAddres(userAddress)
          console.log('Dirección del usuario:', userAddress)

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

  const createNewAccount = async () => {
    if (typeof window !== 'undefined') {
      if (window.ethereum) {
        setLoading(true)
        const web3 = new Web3(window.ethereum)

        try {
          const newAccount = await web3.eth.accounts.wallet.create(1)
          setAccountCreated([...accountsCreated, newAccount[0]])
          console.log('NewAccount: ', newAccount)
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

  // console.log('Accounts created', accountsCreated)

  return (
    <div className='flex min-h-screen flex-col items-center p-24'>
      <div className='flex flex-col items-center p-6 w-auto h-auto bg-gray-300 rounded-lg shadow-lg justify-between'>
        {accounts.length === 0 ? (
          <Button className='w-[120px]' onClick={() => connectWallet()}>
            Connet Wallet
          </Button>
        ) : (
          <div className='flex flex-col'>
            <p>Accounts connected: </p>
            <div className='flex flex-col'>
              {accounts.map((account: string) => {
                return <div key={account}>{account}</div>
              })}
            </div>
            <div className='m-2'>
              {chainId !== mumbaiNetwork.chainId && (
                <p className='text-red-600 font-bold mt-2'>
                  Cambie a la red de Polygon Tesnet Mumbai para operar
                </p>
              )}
            </div>
          </div>
        )}

        {accountsCreated.length > 0 && (
          <div className='flex flex-col'>
            <p>Accounts created: </p>
            <div className='flex flex-col'>
              {accountsCreated.map((account: any, index: number) => {
                return <div key={index}>{account.address}</div>
              })}
            </div>
          </div>
        )}
        <div className='mt-2 items-center'>
          <Button onClick={() => createNewAccount()}>Create new Account</Button>
        </div>
      </div>
    </div>
  )
}

export default Home
