import React, { Component } from "react";
import Pipeline from '@pipeline-ui-2/pipeline/index'; //change to import Pipeline from 'Pipeline for realtime editing Pipeline index.js, and dependency to: "Pipeline": "file:..",
//import steak from './steak.jpg'
import { sendTxns, configAlgosdk } from '@pipeline-ui-2/pipeline/utils'

import { appTXns } from './txns'

import { Algo, Forum } from './astroLists'

import algosdk from 'algosdk'
import { txnAddresses, txnAddresses2, banned } from "./txns";

var asset = parseInt(71460534)

var refresh = false

var ready = false

const myAlgoWallet = Pipeline.init();

Pipeline.main = true;

console.log(Algo[0])

var mynet = (Pipeline.main) ? "MainNet" : "TestNet";

const asas = {
  vHDL: 712922982,
  realHDL: 137594422,
  AlgoAstro: Algo,
  ForumAstro: Forum,
  PlatAstro: 673621287,
  tinyHDLALGO: 552706313,
  algoFiHDLALGO: 607696609
}

function checkFastros(asa, amount) {
  if (asas.ForumAstro.includes(asa)) {
    return amount
  }
  else {
    return 0
  }
}

function checkAastros(asa, amount) {
  if (asas.AlgoAstro.includes(asa)) {
    return amount
  }
  else {
    return 0
  }
}



class App extends Component {

  constructor(props) {
    super(props)
    this.state = {
      net: mynet,
      txID: "",
      myAddress: "",
      balance: 0,
      appAddress: "",
      goal: 0,
      level: 0,
      fundAmount: "Not fetched yet...",
      share: 0,
      depositAmount: 0,
      myProfits: 0,
      withdrawn: 0,
      contribution: 0,
      staked: 0,
      rewards: 0,
      stakedRound: 0,
      currentRound: 0,
      myAsaBalance: "Not fetched yet...",
      poolBalance: "Not fetched yet...",
      poolABalance: "Not fetched yet...",
      asaValue: "?",
      rate: 1,
      asa2algo: 0,
      algo2asa: 0,
      vHDL: 0,
      "Algo Astros": 0,
      "Platinum Astros": 0,
      "Forum Astros": 0,
      rHDL: 0,
      vvHDL: 0,
      vrHDL: 0,
      log: "Hello World"

    }
  }

  componentDidMount() {
    if (localStorage.getItem("dispensed") === null) {
      localStorage.setItem("dispensed", "")
    }
  }

  setNet = (event) => {
    if (event.target.value === "TestNet") {
      Pipeline.main = false
      this.setState({ net: "TestNet" })
    }
    else {
      Pipeline.main = true
      this.setState({ net: "MainNet" })
    }

  }

  handleConnect = () => {
    Pipeline.connect(myAlgoWallet).then(
      data => {
        this.setState({ myAddress: data });
      }
    );
  }

  switchConnector = (event) => {
    Pipeline.pipeConnector = event.target.value
    console.log(Pipeline.pipeConnector)
  }

  startRefresh = () => {
    this.fundingLevel()
    if (!refresh) { setInterval(() => this.fundingLevel(), 5000) }
    refresh = true
  }

  ban = () => {
    let appId = document.getElementById("appid").value
    let userAddress = document.getElementById("userAddress").value
    let amount = parseInt(document.getElementById("tokenId").value) * 1000000

    Pipeline.appCall(appId, ["ban", amount], [userAddress], []).then(data => {
      this.setState({ txID: data })
    })
  }

  dispense = async () => {
    let addresses = document.getElementById("addresses").value.replaceAll(" ", "").split(",")

    let url = ""

    if (!Pipeline.main) {
      url = "https://testnet-idx.algonode.cloud"
    }
    else {
      url = "https://mainnet-idx.algonode.cloud"
    }

    for (let i = 0; i < addresses.length; i++) {

      addresses[i] = addresses[i].trim()

      let valid = algosdk.isValidAddress(addresses[i])

      if (valid) {

        let appData = await fetch(url + '/v2/accounts/' + addresses[i])

        let appJSON = await appData.json()

        let reward = 0

        let HDL = 0
        let pAstro = 0
        let fAstro = 0
        let aAstro = 0
        let tinyHDLALGO = 0
        let algoFiHDLALGO = 0
        let asaOpted = false

        appJSON.account.assets.forEach(element => {
          let amount = element.amount

          switch (element["asset-id"]) {
            case asas.vHDL:
              asaOpted = true
              break;
            case asas.realHDL:
              HDL = amount
              break;
            case asas.PlatAstro:
              pAstro = amount
              break;
            case asas.tinyHDLALGO:
              tinyHDLALGO = amount
              break;
            case asas.algoFiHDLALGO:
              algoFiHDLALGO = amount
              break;
            default:
              fAstro += checkFastros(element["asset-id"], amount)
              aAstro += checkAastros(element["asset-id"], amount)
              break;
          }
        })

        let fakeHDLS = (tinyHDLALGO + algoFiHDLALGO) * 2
        HDL += fakeHDLS

        reward = parseInt(HDL + (pAstro * 0.05 * HDL) + (fAstro * 0.0025 * HDL) + (aAstro * 0.03 * HDL))

        if (HDL >= 2000000000 && pAstro >= 1 && asaOpted) {

          console.log("HDL: " + HDL + ", pAstro: " + pAstro + ", fAstro: " + fAstro + ", aAstro: " + aAstro + ", REWARD = " + (reward / 1000000) + " sHDL for user: " + addresses[i])

          let dispensed = localStorage.getItem("dispensed")
          if (
            (!dispensed.includes(addresses[i]) &&
              !txnAddresses.includes(addresses[i])) ||
            banned.includes(addresses[i])
          ) {
            let data = await Pipeline.send(
              addresses[i],
              reward,
              "Virtual HDL Token dispensed",
              undefined,
              undefined,
              asas.vHDL
            )

            console.log("Sent " +
                  reward / 1000000 +
                  " sHDL to user: " +
                  addresses[i] +
                  " with txid: " +
                  data,
              );

              if (data !== undefined) {
                localStorage.setItem(
                  "dispensed",
                  dispensed + "," + addresses[i]
                );
              }
          }
        }
        else {
          console.log("Detected that user " + addresses[i] + " is ineligible or not opted into sHDL" )
        }
      }
    }
  }

  sniff = async (appIndex) => {

    let tvlStart = 4503659951508

    appIndex = parseInt(document.getElementById("appid").value)

    /* let addresses = document.getElementById("addresses").value.replaceAll(" ", "").split(",") */

    let addresses = txnAddresses

    let url = ""

    if (!Pipeline.main) {
      url = "https://testnet-idx.algonode.cloud"
    }
    else {
      url = "https://mainnet-idx.algonode.cloud"
    }

    for (let i = 0; i < addresses.length; i++) {

      let appData = await fetch(url + '/v2/accounts/' + addresses[i])

      let appJSON = await appData.json()

      let reward = 0

      let HDL = 0
      let pAstro = 0
      let fAstro = 0
      let aAstro = 0
      let tinyHDLALGO = 0
      let algoFiHDLALGO = 0

      appJSON.account.assets.forEach(element => {
        let amount = element.amount

        switch (element["asset-id"]) {
          case asas.realHDL:
            HDL = amount
            break;
          case asas.PlatAstro:
            pAstro = amount
            break;
          case asas.tinyHDLALGO:
            tinyHDLALGO = amount
            break;
          case asas.algoFiHDLALGO:
            algoFiHDLALGO = amount
            break;
          default:
            fAstro += checkFastros(element["asset-id"], amount)
            aAstro += checkAastros(element["asset-id"], amount, true)
            break;
        }
      })

      let fakeHDLS = (tinyHDLALGO + algoFiHDLALGO) * 2
      HDL += fakeHDLS

      reward = parseInt(HDL + (pAstro * 0.05 * HDL) + (fAstro * 0.0025 * HDL) + (aAstro * 0.03 * HDL))

      let AppStates = await appJSON.account["apps-local-state"]

      if (AppStates !== undefined) {
        AppStates.forEach(async (state) => {
          if (state.id === parseInt(appIndex)) {
            let optedIn = true
            let rAmount = 0
            let banned = false
            let keyvalues = state["key-value"]
            if (keyvalues !== undefined) {
              keyvalues.forEach(entry => {
                switch (entry.key) {
                  case "YmFubmVk":
                    if (entry.value.uint === 1) { banned = true }
                    break;
                  case "dkhETA==":
                    rAmount = entry.value.uint
                    break;
                  default:
                    break;
                }


              })
            }

            let minWiggle = rAmount - (rAmount * 0.1)


            if (optedIn !== undefined) {
              if ((HDL < 2000000000 || pAstro === 0 || reward < minWiggle) && !banned) {
                this.setState({ log: this.state.log + "\nAbout to ban user: " + addresses[i] + " Staked: " + rAmount + " Balance: " + " HDL: " + HDL + " pAstro: " + pAstro + " aAstro: " + aAstro + " fAstro: " + fAstro })

                Pipeline.appCall(appIndex, ["ban"], [addresses[i]]).then(txid => {
                  this.setState({ log: this.state.log + "\nBanned txid: " + txid })
                })

              }
              else {
                if (banned) {
                  this.setState({ log: this.state.log + "\nDetected banned user: " + addresses[i]})
                  tvlStart -= rAmount
                  this.setState({ log: this.state.log + "\nTVL modified: " + tvlStart})
                }
              }
            }
          }
        })
      }
    }
  }

  connect = async () => {
    let data = await Pipeline.connect(myAlgoWallet)
    alert("You are connected with address " + data)
  }

  salvage = async () => {
    let appIndex = parseInt(document.getElementById("appid").value)
    let appAddress = algosdk.getApplicationAddress(appIndex)
    let amount = parseInt(document.getElementById("sAmount").value)
    let txid = await Pipeline.appCall(appIndex, ["salvage", amount], [appAddress], [parseInt(asas.realHDL)])
    alert(txid)
  }

  render() {
    return (
      <div align="center">
        <button onClick={() => { localStorage.clear() }}>Clear Local Storage</button>
        <button onClick={this.connect}>Connect</button><br></br>
        <input id="appid" value="759697609" placeholder="app id" type="number"></input><br></br>
        <input id="addresses" placeholder="address list"></input><button onClick={this.dispense}>Dispense Tokens</button><br></br>
        <button onClick={this.sniff}><h1>BAN-HAMMER!</h1></button><br></br>
        <input id="sAmount" type="number"></input>
        <button onClick={this.salvage}><h1>SALVAGE! RUN! ALERT! PILLAGE!</h1></button><br></br>
        <textarea style={{ width: "800px", height: "800px" }} value={this.state.log}></textarea>
      </div>

    );
  }
}

export default App;
