import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import "@fontsource/roboto";
import "./App.css";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { DataGrid, GridRowsProp, GridColDef } from "@mui/x-data-grid";
import IconButton from "@mui/material/IconButton";
import SettingsIcon from "@mui/icons-material/Settings";
import { CloudUpload } from "@mui/icons-material";
import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  ThemeProvider,
} from "@mui/material";
import {
  E164Number,
  findPhoneNumbersInText,
  PhoneNumber,
} from "libphonenumber-js";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import useStyles from "./styles";
import { AxiosResponse } from "axios";
import { createTheme } from "@mui/material/styles";
import axios from "axios";

const theme = createTheme();

const COUNTRY_CODE = "DE";
const SMS_LENGTH = 160;

interface PhoneNumberStatus {
  number: PhoneNumber;
  status: boolean;
  running: boolean;
  textStatus: string;
  messageObject: { [key: string]: unknown };
}

interface SettingsObject {
  fromNumber: string;
  accountSID: string;
  authToken: string;
}

interface SettingsProps {
  open: boolean;
  onClose: () => void;
  onSave: (settingsObject: SettingsObject) => void;
  settings: SettingsObject;
}

const Settings = (props: SettingsProps) => {
  const { open, settings } = props;
  const [changedSettings, setSettings] = useState<SettingsObject>(settings);
  const [snackbar, setSnackbar] = useState("");

  useEffect(() => {
    setSettings(settings);
  }, [settings]);
  const closeSnackbar = () => {
    setSnackbar("");
  };

  const handleClose = () => {
    props.onClose();
  };

  const handleSave = () => {
    if (
      changedSettings.fromNumber &&
      changedSettings.accountSID &&
      changedSettings.authToken
    ) {
      props.onSave(changedSettings);
    } else {
      setSnackbar("invalid");
    }
  };

  return (
    <div>
      <Snackbar
        open={snackbar === "invalid"}
        autoHideDuration={3000}
        onClose={closeSnackbar}
      >
        <Alert onClose={closeSnackbar} severity="error">
          Please fill all fields.
        </Alert>
      </Snackbar>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Settings</DialogTitle>
        <DialogContent>
          <TextField
            label="From (number)"
            variant="outlined"
            fullWidth
            defaultValue={changedSettings.fromNumber}
            onChange={(e) => {
              setSettings({ ...changedSettings, fromNumber: e.target.value });
            }}
            margin="normal"
          />
          <TextField
            label="Twilio Account SID"
            variant="outlined"
            fullWidth
            margin="normal"
            defaultValue={changedSettings.accountSID}
            onChange={(e) => {
              setSettings({ ...changedSettings, accountSID: e.target.value });
            }}
          />
          <TextField
            label="Twilio Auth Token"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            defaultValue={changedSettings.authToken}
            onChange={(e) => {
              setSettings({ ...changedSettings, authToken: e.target.value });
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSave} color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

interface MainProps {
  settings: SettingsObject;
}

const Main = (props: MainProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { settings } = props;
  const twilioClient =
    settings.accountSID &&
    settings.authToken &&
    settings.accountSID.indexOf("AC") !== -1;
  const [snackbar, setSnackbar] = useState("");

  const closeSnackbar = () => {
    setSnackbar("");
  };

  const [phoneNumbers, setPhoneNumbers] = useState<{
    [key: string]: PhoneNumberStatus;
  }>({});
  const [progress, setProgress] = useState(false);

  const [message, setMessage] = useState<string>("");

  const messageLength = message.length;
  const messageValid = messageLength <= SMS_LENGTH;

  // Statistics
  const [detectedNumbers, setDetectedNumbers] = useState<number>(0);
  const [validNumbers, setValidNumbers] = useState<number>(0);
  const [mobileNumbers, setMobileNumbers] = useState<number>(0);

  const [filename, setFilename] = useState("");
  const classes = useStyles();
  const rows: GridRowsProp = Object.values(phoneNumbers).map((value) => {
    return {
      id: value.number.number,
      number: value.number,
      status: value.status,
      textStatus: value.textStatus,
    };
  });
  const columns: GridColDef[] = [
    {
      field: "number",
      headerName: "Phone number",
      width: 200,
      valueGetter: (value) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return value.format("INTERNATIONAL");
      },
    },
    {
      field: "status",
      headerName: "Completely sent",
      width: 100,
      type: "boolean",
    },
    {
      field: "textStatus",
      headerName: "Status",
      width: 400,
    },
  ];

  const resetPhoneNumbers = () => {
    setPhoneNumbers({});
    setDetectedNumbers(0);
    setValidNumbers(0);
    setMobileNumbers(0);
  };

  const causeParseError = () => {
    setSnackbar("parse_error");
    setFilename("");
  };

  const parsePhoneNumbers = (text: string) => {
    return new Promise(
      (resolve: (value: { [key: string]: PhoneNumberStatus }) => void) => {
        // Search for numbers
        const foundNumbers = findPhoneNumbersInText(text, COUNTRY_CODE);

        // Reset statistics
        resetPhoneNumbers();

        // Remap numbers to status
        const parsedNumbers: { [key: string]: PhoneNumberStatus } = {};
        const rawNumbers: E164Number[] = [];
        let detectedNumbersTemp = 0;
        let validNumbersTemp = 0;
        let mobileNumbersTemp = 0;

        // eslint-disable-next-line array-callback-return
        foundNumbers.map((value) => {
          const { number } = value;
          if (rawNumbers.indexOf(number.number) !== -1) {
            // Skip duplicate numbers
            return value;
          }
          detectedNumbersTemp += 1;
          if (number.isPossible() && number.isValid()) {
            validNumbersTemp += 1;

            // Filter for mobile numbers
            const codesToCheck = ["15", "16", "17"];
            let isMobile = false;
            codesToCheck.forEach((code) => {
              if (number.nationalNumber.startsWith(code)) {
                isMobile = true;
              }
            });

            if (isMobile) {
              mobileNumbersTemp += 1;

              // Add phone number status
              rawNumbers.push(number.number);
              parsedNumbers[number.number.toString()] = {
                number,
                status: false,
                running: false,
                textStatus: "",
                messageObject: {},
              };
            }
          }
          return value;
        });
        setDetectedNumbers(detectedNumbersTemp);
        setValidNumbers(validNumbersTemp);
        setMobileNumbers(mobileNumbersTemp);
        resolve(parsedNumbers);
      },
    );
  };

  const setPhoneNumberProperty = (phoneNumber: PhoneNumberStatus) => {
    const phoneNumbersCopy = { ...phoneNumbers };
    phoneNumbersCopy[phoneNumber.number.number.toString()] = phoneNumber;
    setPhoneNumbers(phoneNumbersCopy);
  };

  const sendMessagesDisabled =
    Object.values(phoneNumbers).length < 1 || !twilioClient || !message;

  const updateMessageStatus = (number: string) => {
    if (!(number in phoneNumbers) || !phoneNumbers[number].messageObject) {
      return;
    }
    const phoneNumber = phoneNumbers[number];
    axios
      .get(
        `https://api.twilio.com/2010-04-01/Accounts/${settings.accountSID}/Messages/${phoneNumber.messageObject.sid}.json`,
        {
          auth: { username: settings.accountSID, password: settings.authToken },
        },
      )
      .then((response: AxiosResponse) => {
        console.log(response, response.data.status, number);
        phoneNumber.messageObject = response.data;
        phoneNumber.textStatus = response.data.status;
        if (
          response.data.status !== "delivered" &&
          response.data.status !== "undelivered" &&
          response.data.status !== "failed" &&
          response.data.status !== "delivery_unknown"
        ) {
          setPhoneNumberProperty(phoneNumber);
          setTimeout(() => {
            updateMessageStatus(number);
          }, 5000);
        } else {
          phoneNumber.status = true;
          setPhoneNumberProperty(phoneNumber);
        }
        return response;
      })
      .catch((error: any) => {
        console.log(error);
      });
  };

  const sendMessages = () => {
    if (sendMessagesDisabled) {
      setSnackbar("send_disabled");
      return;
    }
    Object.values(phoneNumbers).forEach((phoneNumber) => {
      let bodyData = new FormData();
      bodyData.append("From", settings.fromNumber);
      bodyData.append("To", phoneNumber.number.number);
      bodyData.append("Body", message);
      axios
        .post(
          `https://api.twilio.com/2010-04-01/Accounts/${settings.accountSID}/Messages.json`,
          bodyData,
          {
            auth: {
              username: settings.accountSID,
              password: settings.authToken,
            },
          },
        )
        .then((response: AxiosResponse) => {
          console.log(response.data, response);
          phoneNumber.messageObject = response.data;
          phoneNumber.textStatus = response.data.status;
          setPhoneNumberProperty(phoneNumber);
          setTimeout(() => {
            updateMessageStatus(phoneNumber.number.number.toString());
          }, 1000);
          return response;
        })
        .catch((error: any) => {
          phoneNumber.messageObject = {};
          phoneNumber.textStatus = error.toJSON().toString();
          setPhoneNumberProperty(phoneNumber);
          return error;
        });
    });
  };

  return (
    <section className={classes.section}>
      <Snackbar
        open={snackbar === "parse_error"}
        autoHideDuration={3000}
        onClose={closeSnackbar}
      >
        <Alert onClose={closeSnackbar} severity="error">
          There was an error while parsing the file.
        </Alert>
      </Snackbar>
      <Snackbar
        open={snackbar === "parse_success"}
        autoHideDuration={3000}
        onClose={closeSnackbar}
      >
        <Alert onClose={closeSnackbar} severity="success">
          The file has been successfully parsed.
        </Alert>
      </Snackbar>
      <Snackbar
        open={snackbar === "send_disabled"}
        autoHideDuration={3000}
        onClose={closeSnackbar}
      >
        <Alert onClose={closeSnackbar} severity="error">
          Cannot send due to one of the following reasons: No message entered or
          Twilio API not configured
        </Alert>
      </Snackbar>
      <Dialog open={progress}>
        <DialogTitle>Please wait</DialogTitle>
        <DialogContent className={classes.circular}>
          <CircularProgress />
        </DialogContent>
      </Dialog>
      <Card className={classes.marginBottom}>
        <CardContent>
          <Typography
            variant="h6"
            component="h2"
            className={classes.marginBottom}
          >
            Load a file with phone numbers
          </Typography>
          <div>
            <Button variant="outlined" component="label">
              <CloudUpload />
              <input
                type="file"
                onChange={(e) => {
                  const filenameSplit = String(e.target.value)
                    .split("\\")
                    .pop();
                  setFilename(filenameSplit || "");

                  if (e.target.files) {
                    const file = e.target.files[0];
                    console.log(e.target);
                    console.log("FIle threre", file.type);
                    console.log("Files text");
                    // Read and parse file content
                    const reader = new FileReader();
                    reader.onerror = causeParseError;
                    reader.onabort = causeParseError;
                    reader.onload = function fileReadCompleted() {
                      const fileContent = reader.result || "";
                      console.log(fileContent);
                      if (typeof fileContent === "string") {
                        setProgress(true);
                        parsePhoneNumbers(fileContent)
                          .then(
                            (parsedNumbers: {
                              [key: string]: PhoneNumberStatus;
                            }) => {
                              setPhoneNumbers(parsedNumbers);
                              setProgress(false);
                              setSnackbar("parse_success");
                              return parsedNumbers;
                            },
                          )
                          .catch(() => {
                            causeParseError();
                            setProgress(false);
                          });
                      } else {
                        causeParseError();
                      }
                    };
                    reader.readAsText(file);
                  } else {
                    causeParseError();
                  }
                }}
                className={classes.fileInput}
              />
            </Button>
            <span className={classes.fileLabel}>
              {filename || "No file selected"}
            </span>
          </div>
        </CardContent>
      </Card>
      <Grid
        container
        justifyContent="center"
        spacing={1}
        className={classes.marginBottom}
      >
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h3">{detectedNumbers}</Typography>
              <Typography variant="overline">Detected numbers</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h3">{validNumbers}</Typography>
              <Typography variant="overline">Valid numbers</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h3">{mobileNumbers}</Typography>
              <Typography variant="overline">Mobile numbers</Typography>
            </CardContent>{" "}
          </Card>
        </Grid>
      </Grid>
      <DataGrid
        rows={rows}
        columns={columns}
        className={classes.marginBottom}
      />
      <Card>
        <CardContent>
          <TextField
            label="Message"
            multiline
            rows={4}
            variant="outlined"
            fullWidth
            error={!messageValid}
            helperText={`${messageLength} characters`}
            onChange={(e) => {
              setMessage(e.target.value);
            }}
          />
          <Typography variant="body2" display="block">
            Please check your message using the{" "}
            <a
              href="https://twiliodeved.github.io/message-segment-calculator/"
              target="_blank"
              rel="noreferrer"
            >
              Twilio Messaging Segment Calculator
            </a>
            .
          </Typography>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Button
            variant="contained"
            color="primary"
            onClick={sendMessages}
            disabled={sendMessagesDisabled}
          >
            {Object.keys(phoneNumbers).length > 0
              ? `Send ${Object.keys(phoneNumbers).length} messages`
              : "Send messages"}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
};

export default function App(props: unknown) {
  const classes = useStyles();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<SettingsObject>({
    fromNumber: "",
    accountSID: "",
    authToken: "",
  });

  const [snackbar, setSnackbar] = useState("");
  const closeSnackbar = () => {
    setSnackbar("");
  };

  const loadSettings = () => {
    const settingsObject: SettingsObject = {
      fromNumber: localStorage.getItem("fromNumber") || "",
      accountSID: localStorage.getItem("accountSID") || "",
      authToken: localStorage.getItem("authToken") || "",
    };
    setSettings(settingsObject);
  };

  useEffect(() => {
    loadSettings();
  }, [props]);

  const saveSettings = (settingsObject: SettingsObject) => {
    localStorage.setItem("fromNumber", settingsObject.fromNumber);
    localStorage.setItem("accountSID", settingsObject.accountSID);
    localStorage.setItem("authToken", settingsObject.authToken);
    setSettingsOpen(false);
    setSnackbar("settings_success");
    loadSettings();
  };
  return (
    <ThemeProvider theme={theme}>
      <div>
        <Snackbar
          open={snackbar === "settings_success"}
          autoHideDuration={3000}
          onClose={closeSnackbar}
        >
          <Alert onClose={closeSnackbar} severity="success">
            The settings have been successfully saved.
          </Alert>
        </Snackbar>
        <header>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" className={classes.title}>
                Twilio: Simple Send
              </Typography>
              <IconButton
                edge="end"
                color="inherit"
                onClick={() => {
                  setSettingsOpen(true);
                }}
                size="large"
              >
                <SettingsIcon />
              </IconButton>
            </Toolbar>
          </AppBar>
        </header>
        <Settings
          open={settingsOpen}
          onClose={() => {
            setSettingsOpen(false);
          }}
          onSave={saveSettings}
          settings={settings}
        />
        <main className={classes.main}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Main settings={settings} />} />
            </Routes>
          </BrowserRouter>
        </main>
      </div>
    </ThemeProvider>
  );
}
