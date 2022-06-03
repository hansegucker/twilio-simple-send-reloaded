import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
  main: {
    padding: theme.spacing(1),
  },
  section: {
    height: '100%',
  },
  gridIcon: {
    margin: 16,
  },
  fileInput: {
    display: 'none',
  },
  fileLabel: {
    marginLeft: '10px',
  },
  marginBottom: {
    marginBottom: theme.spacing(1),
  },
  circular: {
    minWidth: '200px',
    display: 'flex',
    justifyContent: 'center',
    marginBottom: theme.spacing(3),
  },
}));

export default useStyles;
