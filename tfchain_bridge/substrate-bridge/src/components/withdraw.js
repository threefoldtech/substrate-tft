import React, { useState, useEffect } from 'react'
import { FormControl, InputLabel, Input, FormHelperText, Button, Dialog } from '@material-ui/core'
import DialogActions from '@material-ui/core/DialogActions'
import DialogTitle from '@material-ui/core/DialogTitle'
import stellar from 'stellar-sdk'
import env from "react-dotenv"

const TFT_ASSET = 'TFT'
const STELLAR_HORIZON_URL = env.STELLAR_HORIZON_URL
const TFT_ASSET_ISSUER = env.TFT_ASSET_ISSUER
const BRIDGE_TFT_ADDRESS = env.BRIDGE_TFT_ADDRESS
const server = new stellar.Server(STELLAR_HORIZON_URL)

export function Withdraw({ open, handleClose, balance, submitWithdraw }) {
  const [stellarAddress, setStellarAddress] = useState('')
  const [stellarAddressError, setStellarAddressError] = useState('')

  const [amount, setAmount] = useState(0)
  const [amountError, setAmountError] = useState('')

  // Initialize balance
  useEffect(() => {
    if (balance) {
      setAmount(parseInt(balance, 10) / 10e6)
    }
  }, [balance])

  const submit = async () => {
    if (stellarAddress === '') {
      setStellarAddressError('Address not valid')
      return
    }

    if (stellarAddress === BRIDGE_TFT_ADDRESS) {
      setStellarAddressError('Cannot withdraw to bridge account, use your personal wallet address')
      return
    }

    try {
      // check if the account provided exists on stellar
      const account = await server.loadAccount(stellarAddress)
      // check if the account provided has the appropriate trustlines
      const includes = account.balances.find(b => b.asset_code === TFT_ASSET && b.asset_issuer === TFT_ASSET_ISSUER)
      if (!includes) {
        setStellarAddressError('Address does not have a valid trustline to TFT')
        return
      }
    } catch (error) {
      setStellarAddressError('Address not found')
      return
    }

    if (amount <= 0 || amount > balance / 1e7) {
      setAmountError('Amount not valid')
      return
    }

    setStellarAddressError('')
    setAmountError('')

    submitWithdraw(stellarAddress, amount)
  }

  const handleStellarAddressChange = (e) => {
    setStellarAddressError('')
    setStellarAddress(e.target.value)
  }

  const handleAmountChange = (e) => {
    setAmountError('')
    try {
      const a = parseFloat(e.target.value)
      if (isNaN(a)) {
        setAmount(0)
      } else {
        setAmount(a)
      }
    } catch (err) {
      setAmountError(err)
      setAmount(0)
    }
  }

  return (
    <div>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        fullScreen={true}
      >
        <DialogTitle id="alert-dialog-title">{"Swap BSC TFT for Stellar TFT"}</DialogTitle>
        <div style={{ padding: '50px', display: 'flex', flexDirection: 'column', width: '60%', margin: 'auto' }}>
          <span>Fill in this form to withdraw tokens back to Stellar</span>
          <FormControl>
          <InputLabel htmlFor="StellarAddress">Stellar Address</InputLabel>
          <Input 
            value={stellarAddress}
            onChange={handleStellarAddressChange}
            id="StellarAddress"
            aria-describedby="my-helper-text"
          />
          <FormHelperText id="my-helper-text">Enter a valid Stellar Address</FormHelperText>
          {stellarAddressError && (
              <div>{stellarAddressError}</div>
          )}
          </FormControl>

          <FormControl>
          <InputLabel htmlFor="StellarAddress">Amount</InputLabel>
          <Input 
            value={amount}
            onChange={handleAmountChange}
            id="amount"
            type='number'
            inputProps={{step: 0.01}}
          />
          <FormHelperText id="my-helper-text">Enter an amount, balance: {balance / 1e7}</FormHelperText>
          {amountError && (
              <div>{amountError}</div>
          )}
          </FormControl>

          <Button 
            color='primary'
            variant="contained"
            style={{ marginTop: 25 }}
            type='submit'
            onClick={() => submit()}
            >
            Withdraw
          </Button>
        </div>
        <DialogActions>
          <Button style={{ width: 200, height: 50 }} variant='contained' onClick={handleClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}