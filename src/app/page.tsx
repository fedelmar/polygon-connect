'use client'
declare global {
  interface Window {
    ethereum?: any
  }
}
import { useEffect, useState } from 'react'
import { Button } from '../components/ui/button'
import Web3, { Contract, Web3BaseWalletAccount } from 'web3'
import { abi, contractAddress } from '@/constants'

const adminAddress = process.env.NEXT_PUBLIC_ACCOUNT_ADDRESS
const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY
const mumbaiInfuraProvider = process.env.NEXT_PUBLIC_POLYGON_MUMBAI_URL

const Home = () => {
  const [accountCreated, setAccountCreated] = useState<Web3BaseWalletAccount>()
  const [loadingTx, setLoadingTx] = useState<boolean>(false)
  const [accountBalance, setAccountBalance] = useState<string>('0')
  const [loading, setLoading] = useState<boolean>(true)
  const [web3Instance, setWeb3] = useState<Web3>()
  const [contract, setContract] = useState<Contract<any>>()
  const [error, setError] = useState<any>('')
  const [isApprovedForAll, setIsApprovedForAll] = useState<boolean>(false)
  const [gasPrice, setGasPrice] = useState<any>()
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined' && mumbaiInfuraProvider) {
      if (window.ethereum) {
        const web3 = new Web3(
          new Web3.providers.HttpProvider(mumbaiInfuraProvider),
        )

        setWeb3(web3)

        const contract = new web3.eth.Contract(abi, contractAddress)
        setContract(contract)
        const getGasPrice = async () => {
          const res = await web3.eth.getGasPrice()
          setGasPrice(res)
        }
        getGasPrice()
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (accountCreated) {
      fundAccount(accountCreated)
    }
  }, [accountCreated])

  useEffect(() => {
    if (accountCreated && accountBalance !== '0') {
      setApprovalForAll(accountCreated)
    }
  }, [accountCreated, accountBalance])

  useEffect(() => {
    const intervalId = setInterval(() => {
      checkPendingTransactions()
    }, 5000)
    return () => clearInterval(intervalId)
  }, [pendingTransactions])

  const addToPendingTransactions = (transaction: any, type: string) => {
    setPendingTransactions((prevTransactions) => [
      ...prevTransactions,
      { tx: transaction, type },
    ])
  }

  const removeFromPendingTransactions = (hash: string) => {
    setPendingTransactions((prevTransactions) =>
      prevTransactions.filter((t) => t.tx.hash !== hash),
    )
  }

  const checkPendingTransactions = async () => {
    if (
      pendingTransactions.length > 0 &&
      web3Instance &&
      accountCreated &&
      contract
    ) {
      for (let i = 0; i < pendingTransactions.length; i++) {
        const tx = pendingTransactions[i].tx

        try {
          const receipt = await web3Instance.eth.getTransactionReceipt(tx.hash)
          if (receipt) {
            removeFromPendingTransactions(tx.hash)
            if (pendingTransactions[i].type === 'transfer') {
              console.log(
                'Transferencia exitosa. Hash de transacción:',
                tx.hash,
              )
              const balance = await web3Instance.eth.getBalance(
                accountCreated.address,
              )
              const balanceMatic = web3Instance.utils.fromWei(balance, 'ether')
              setAccountBalance(balanceMatic)
              setLoadingTx(false)
            } else {
              console.log(
                'Llamada a setApprovedForAll exitosa. Hash de transacción:',
                tx.hash,
              )
              const isApprovedForAll = await contract.methods
                .isApprovedForAll(accountCreated.address, adminAddress)
                .call()
              console.log(isApprovedForAll && 'Is approved for all!')
              isApprovedForAll && setIsApprovedForAll(true)
            }
          }
        } catch (error) {
          console.error(`Error checking transaction: ${tx.hash}`, error)
        }
      }
    }
  }

  if (loading)
    return (
      <div className='flex flex-col items-center p-6  justify-between'>
        Loading...
      </div>
    )

  const createAccount = () => {
    if (web3Instance) {
      const newAccount = web3Instance.eth.accounts.create()
      setAccountCreated(newAccount)
    }
  }

  const fundAccount = async (account: Web3BaseWalletAccount) => {
    if (web3Instance && privateKey) {
      setLoadingTx(true)
      try {
        const transferAmount = web3Instance.utils.toWei('0.001', 'ether')
        const currentNonce = await web3Instance.eth.getTransactionCount(
          adminAddress!,
        )
        const tx = await web3Instance.eth.accounts.signTransaction(
          {
            from: adminAddress,
            to: account.address,
            value: transferAmount,
            gas: 21000,
            gasPrice,
            nonce: currentNonce,
          },
          privateKey,
        )
        console.log('Tx enviada')
        addToPendingTransactions({ hash: tx.transactionHash }, 'transfer')
        await web3Instance.eth.sendSignedTransaction(tx.rawTransaction)
      } catch (error) {
        setError(error)
      }
    }
  }

  const setApprovalForAll = async (account: Web3BaseWalletAccount) => {
    if (contract && web3Instance && privateKey) {
      try {
        const data = contract.methods
          .setApprovalForAll(adminAddress, true)
          .encodeABI()
        const gasLimit = await contract.methods
          .setApprovalForAll(adminAddress, true)
          .estimateGas({ from: account.address })
        const txObject = {
          from: account.address,
          to: contract.options.address,
          gas: gasLimit,
          gasPrice,
          data,
        }
        const signedTx = await web3Instance.eth.accounts.signTransaction(
          txObject,
          account.privateKey,
        )
        console.log('Tx setApprovalForAll enviada')
        addToPendingTransactions({ hash: signedTx.transactionHash }, 'approval')
        await web3Instance.eth.sendSignedTransaction(signedTx.rawTransaction)
      } catch (error) {
        setError(error)
      }
    } else {
      console.log('missing something')
    }
  }

  return (
    <div className='flex min-h-screen flex-col items-center p-24'>
      <div className='flex flex-col items-center p-6 w-auto h-auto bg-gray-300 rounded-lg shadow-lg justify-between'>
        {accountCreated && (
          <div className='flex flex-col'>
            <p>Account created: </p>
            <div className='flex flex-col'>
              <div>{accountCreated?.address}</div>
            </div>

            {loadingTx ? (
              <p className='text-blue-800 font-bold'>
                Please wait a moment, we are funding your new account.
              </p>
            ) : (
              <div>
                <p>Account Balance: {accountBalance} </p>

                {isApprovedForAll ? (
                  <p className='text-green-800 font-bold'>
                    Your account is fully functional.
                  </p>
                ) : (
                  <p className='text-blue-800 font-bold'>
                    Your account is almost ready, just a moment...
                  </p>
                )}
              </div>
            )}
            <div className='m-2'>
              {error !== '' && (
                <p className='text-red-600 font-bold mt-2'>{error}</p>
              )}
            </div>
          </div>
        )}

        {web3Instance && contract && !accountCreated && (
          <div className='mt-2 items-center'>
            <Button onClick={() => createAccount()}>Create new account</Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home
