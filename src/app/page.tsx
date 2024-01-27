'use client'
declare global {
  interface Window {
    ethereum?: any
  }
}

import { useEffect, useState } from 'react'
import { Button } from '../components/ui/button'
import Web3 from 'web3'

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

  const connectWallet = async () => {
    if (typeof window !== 'undefined') {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum)

        try {
          const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts',
          })

          const userAddress = accounts[0]
          setUserAddres(userAddress)
          console.log('Dirección del usuario:', userAddress)

          const chainId = await web3.eth.getChainId()
          console.log('Chain Id: ', `0x${Number(chainId).toString(16)}`)
          setChainId(`0x${Number(chainId).toString(16)}`)
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
      <div className='flex flex-col items-center p-6 w-[500px] h-[90px] bg-gray-300 rounded-lg shadow-lg justify-between'>
        {userAddress === '' ? (
          <Button className='w-[120px]' onClick={() => connectWallet()}>
            Connet Wallet
          </Button>
        ) : (
          <div className='flex flex-col'>
            <p>User Address:</p>
            <p>{userAddress}</p>
          </div>
        )}
      </div>
        {chainId !== mumbaiNetwork.chainId && (
          <p className='text-red-600 font-bold mt-2'>Cambie a la red de Polygon Tesnet Mumbai para operar</p>
        )}
    </div>
  )
}

export default Home
