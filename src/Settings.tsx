import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

import type { SettingsObject } from "./types";


interface SettingsProps {
  open: boolean;
  onClose: () => void;
  onSave: (settingsObject: SettingsObject) => void;
  settings: SettingsObject;
}


export default (props: SettingsProps) => {
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
