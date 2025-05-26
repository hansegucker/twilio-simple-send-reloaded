import { useEffect, useState } from "react";
import "@fontsource/roboto";
import "./App.css";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  ThemeProvider,
} from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import useStyles from "./styles";
import { createTheme } from "@mui/material/styles";
import Main from "./Main";
import Settings from "./Settings";
import type { SettingsObject } from "./types";

const theme = createTheme();

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
          <Main settings={settings} />
        </main>
      </div>
    </ThemeProvider>
  );
}
