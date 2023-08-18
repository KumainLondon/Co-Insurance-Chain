import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Button,
  Snackbar,
  Alert,
  Link,
  Typography,
  Box,
  Divider
} from "@mui/material";
import {
  Scrypt,
  ScryptProvider,
  SensiletSigner,
  ContractCalledEvent,
  ByteString,
} from "scrypt-ts";
import { Buying } from "./contracts/buying";
import Footer from "./Footer";

// `npm run deploycontract` to get deployment transaction id
const contract_id = {
  /** The deployment transaction id */
  txId: "5b684ab658ad9e6d40ef5376c6005fb5910190cc75d5a6dda8aa27a70a853871",
  /** The output index */
  outputIndex: 0,
};

function byteString2utf8(b: ByteString) {
  return Buffer.from(b, "hex").toString("utf8");
}

function App() {
  const [buyingContract, setContract] = useState<Buying>();
  const signerRef = useRef<SensiletSigner>();
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState<{
    txId: string;
    insurance: string;
  }>({
    txId: "",
    insurance: "",
  });

  async function fetchContract() {
    try {
      const instance = await Scrypt.contractApi.getLatestInstance(
        Buying,
        contract_id
      );
      setContract(instance);
    } catch (error: any) {
      console.error("fetchContract error: ", error);
      setError(error.message);
    }
  }

  useEffect(() => {
    const provider = new ScryptProvider();
    const signer = new SensiletSigner(provider);

    signerRef.current = signer;

    fetchContract();

    const subscription = Scrypt.contractApi.subscribe(
      {
        clazz: Buying,
        id: contract_id,
      },
      (event: ContractCalledEvent<Buying>) => {
        setSuccess({
          txId: event.tx.id,
          insurance: event.args[0] as ByteString,
        });
        setContract(event.nexts[0]);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleClose = (
    _event: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setError("");
  };

  const handleSuccessClose = (
    _event: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setSuccess({
      txId: "",
      insurance: "",
    });
  };

  async function buying(e: any) {
    handleSuccessClose(e);
    const signer = signerRef.current as SensiletSigner;

    if (buyingContract && signer) {
      const { isAuthenticated, error } = await signer.requestAuth();
      if (!isAuthenticated) {
        throw new Error(error);
      }

      await buyingContract.connect(signer);

      // create the next instance from the current
      const nextInstance = buyingContract.next();

      const insuranceName = e.target.name;

      // update state
      nextInstance.increase(insuranceName);

      // call the method of current instance to apply the updates on chain
      buyingContract.methods
        .buy(insuranceName, {
          next: {
            instance: nextInstance,
            balance: buyingContract.balance,
          },
        })
        .then((result) => {
          console.log(`Buying call tx: ${result.tx.id}`);
        })
        .catch((e) => {
          setError(e.message);
          fetchContract();
          console.error("call error: ", e);
        });
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <h2>Choose your insurance depends on your age.</h2>
      </header>
      <TableContainer
        component={Paper}
        variant="outlined"
        style={{ width: 600, height: "100vh", margin: "auto" }}
      >
        <Table>
          <TableRow>
            
            <TableCell align="center">
              <Box>
                <Box
                  sx={{
                    height: 200,
                  }}
                  component="img"
                  alt={"25-35"}
                  src={`${process.env.PUBLIC_URL}/${"25-35"}.jpg`}
                />
              </Box>
            </TableCell>
            <TableCell align="center">25-35</TableCell>
            <TableCell align="center">
                <Box>
                  <Typography variant={"h1"} >
                    {buyingContract?.insurances[0].Received.toString()}
                  </Typography><h3>Sold</h3>
                </Box>
            </TableCell> 
            <TableCell>
            <Button
                  variant="text"
                  onClick={buying}
                  name={buyingContract?.insurances[0].name}
                >
                buy
            </Button>
            </TableCell>
          </TableRow>
            
          <TableRow>
            
            <TableCell align="center">
              <Box>
                <Box
                  sx={{
                    height: 200,
                  }}
                  component="img"
                  alt={"35-45"}
                  src={`${process.env.PUBLIC_URL}/${"35-45"}.png`}
                />
              </Box>
            </TableCell>
            <TableCell align="center">35-45</TableCell>
            <TableCell align="center">
              <Divider orientation="vertical" flexItem />
                <Box>
                  <Typography variant={"h1"}>
                    {buyingContract?.insurances[1].Received.toString()}
                  </Typography><h3>Sold</h3>
                </Box>
            </TableCell>
            <TableCell align="center"> 
              <Button
                variant="text"
                onClick={buying}
                name={buyingContract?.insurances[1].name}
                >
                buy
                </Button>
            </TableCell>
            </TableRow>

            <TableRow>
            <TableCell align="center">
              <Box>
                <Box
                  sx={{
                    height: 200,
                  }}
                  component="img"
                  alt={"45-55"}
                  src={`${process.env.PUBLIC_URL}/${"45-55"}.png`}
                />
              </Box>
            </TableCell>
            <TableCell align="center">45-55</TableCell>
            <TableCell align="center">
                <Box>
                  <Typography variant={"h1"} >
                    {buyingContract?.insurances[2].Received.toString()}
                  </Typography><h3>Sold</h3>
                  
                </Box>
              </TableCell> 
            <TableCell>
              <Button
                  variant="text"
                  onClick={buying}
                  name={buyingContract?.insurances[2].name}
                  >
                 buy
              </Button>
            </TableCell>
          </TableRow>
        </Table>
      </TableContainer>
      <Footer />
      <Snackbar
        open={error !== ""}
        autoHideDuration={6000}
        onClose={handleClose}
      >
        <Alert severity="error">{error}</Alert>
      </Snackbar>

      <Snackbar
        open={success.insurance !== "" && success.txId !== ""}
        autoHideDuration={6000}
        onClose={handleSuccessClose}
      >
        <Alert severity="success">
          {" "}
          <Link
            href={`https://test.whatsonchain.com/tx/${success.txId}`}
            target="_blank"
            rel="noreferrer"
          >
            {`"${byteString2utf8(success.insurance)}" got one order,  tx: ${
              success.txId
            }`}
          </Link>
        </Alert>
      </Snackbar>
    </div>
  );
}

export default App;
