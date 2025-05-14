import { makeStyles } from "@mui/styles";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: "8px",
  },
  title: {
    flexGrow: 1,
  },
  main: {
    padding: "4px",
  },
  section: {
    height: "100%",
  },
  gridIcon: {
    margin: 16,
  },
  fileInput: {
    display: "none",
  },
  fileLabel: {
    marginLeft: "10px",
  },
  marginBottom: {
    marginBottom: "4px",
  },
  circular: {
    minWidth: "200px",
    display: "flex",
    justifyContent: "center",
    marginBottom: "12px",
  },
}));

export default useStyles;
