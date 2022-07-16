import './App.css';
import React from 'react';
import {Button} from '@material-ui/core';
import Checkbox from '@material-ui/core/Checkbox';
import {withStyles} from '@material-ui/core/styles';
import {lightGreen, blue} from '@material-ui/core/colors';
import Immutable from 'immutable';
import TextField from "@material-ui/core/TextField";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";

import { createTheme } from '@material-ui/core/styles'
import { ThemeProvider } from '@material-ui/styles';
const greenStyle = {
  root: {
    color: props => {
      // debugger;
      if (props.themChecked) {
        return lightGreen[600];
      } else {
        if (props.serverChecked) {
          return blue[500];
        } else {
          return blue[200];
        }
      }
    },
  },
  checked: {},
};

const theme = createTheme({
  palette: {
    action: {
      disabledBackground: lightGreen[600],
      // disabled: 'set color of text here'
    },
    secondary: {
      main: '#886B7C',
    }
  }
});

const StyledCheckbox = withStyles(greenStyle)((props) => {
  const {serverChecked, themChecked, ...otherProps} = props;
  return <Checkbox color="default" {...otherProps} />


});

const StyledButton = withStyles({
  root: {
    // background: '#886B7C',
    borderRadius: 7,
    border: 0,
    color: 'white',
    height: 40,
    padding: '0 20px',
    '&:hover': {
      backgroundColor: 'black',
    },
    '&:disabled': {
      color: 'white',
      backgroundColor: '#B9A1AF',
    },
  },
  label: {
    textTransform: 'capitalize',
  },
})(Button);

const instructionAccordion = <Accordion style={{marginTop: '50px'}}>
  <AccordionSummary
      aria-controls="panel1a-content"
      id="panel1a-header"
  >
    Show instructions
  </AccordionSummary>
  <AccordionDetails style={{display: 'block'}}>

    <div>
      Select things you would do with people.
      ( <StyledCheckbox
        checked={true}
        themChecked={false}
        serverChecked={false}/> = unsaved selection )
    </div>

    <div>
      Press
      <StyledButton style={{marginLeft: "0.5em"}} variant="contained" disableElevation>Save
      </StyledButton>.
    </div>

    <div>
      Find out if they reciprocate.

      ( <StyledCheckbox
        checked={true}
        themChecked={true}
        serverChecked={true}/> = yes,
      <StyledCheckbox
          checked={true}
          themChecked={false}
          serverChecked={true}/> = no (yet) )
    </div>

    <div>
      If they never reciprocate, nobody knows you tried!
    </div>

    <div>
      If they do, you can do the thing!
    </div>
  </AccordionDetails>
</Accordion>;


const caveatAccordion = <Accordion>
  <AccordionSummary
      aria-controls="panel1a-content"
      id="panel1a-header"
  >
    Show caveats and limitations of this app compared to the old reciprocity.io.
  </AccordionSummary>
  <AccordionDetails style={{display: 'block'}}>

    <div>
      This app has a number of limitations:

      <ul>
        <li>
          There is no way to delete an account. I'm trying to fix this. To delete your account, email bshlegeris@gmail.com.
        </li>
        <li>
          When you match with someone, it doesn't send you an email, it just shows you the green tick.
        </li>
      </ul>

      <p>This app is starting with a fresh database. So it doesn't have anyone's old ticks.</p>

      <p>Thanks to Sid Hough for giving me a UI design which substantially improved on my initial design.
        I made a few "tweaks" to it, so you shouldn't judge her for any of the bad parts.</p>
    </div>
  </AccordionDetails>
</Accordion>;


class App extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      accessToken: null,
      myInfo: null,
      friendsList: null,
      myChecks: null,
      reciprocations: null,
      bioState: null,
      currentChecksState: null,
      myProfilePicUrl: null,
      loggingIn: false,
      myVisibilitySetting: null,
      nameFilter: '',
      updatingVisibility: false,
    }
  }

  componentDidMount() {

    window.setTimeout(() => {
      if (window.FB) {
        window.FB.getLoginStatus((resp) => this.handleFBLogin(resp));
      } else {
        this.componentDidMount();
      }
    }, 100)

  }

  deleteAccount() {
    fetch('/api/delete_user?access_token=' + this.state.accessToken, {method: "DELETE"})
        .then(window.FB.logout(() => window.location.reload()))
        .catch(() => {
          window.FB.getLoginStatus((resp) => this.deleteAccount());
        });
  }

  render() {
    return <div className="app">
      <div id='header'>
        <div id='logout'>{this.state.myInfo &&
        <div>
          <Button onClick={() => window.FB.logout(() => window.location.reload())}>Log
            out</Button>
          {/*<Button onClick={() => this.deleteAccount()}>Delete account</Button>*/}
          <div style={{marginTop: "0.25em", fontStyle: 'italic'}}><span
              style={{color: "rgb(118 255 22)"}}>Signed in as</span>
            <img height={25} width={25} alt={`Your profile pic`}
                 style={{borderRadius: "50%", marginRight: '.25em', marginLeft: '.5em'}}
                 src={this.state.myProfilePicUrl}/>
            {this.state.myInfo.name}</div>
        </div>}</div>
        <h1>reciprocity.io</h1>
        <div style={{color: "rgb(118 255 22)", fontWeight: '700', fontSize: "1.5em"}}>
          what would you do, if they wanted to too?
        </div>
        <div style={{paddingBottom: '50px'}}><a href={'/privacy_policy.txt'}>privacy policy</a></div>


        {!this.state.myInfo &&
        <div id='main'>
          <div>
            <div>You check boxes</div>
            <div>Your friends check boxes</div>
            <div>You see when you've checked each other's boxes</div>
          </div>
          <Button color="primary" variant="contained" disabled={this.state.loggingIn} onClick={() => {
            window.FB.login((resp) => this.handleFBLogin(resp), {scope: 'user_friends,email'});
          }}>{this.state.loggingIn ? "Logging in..." : "Log in with Facebook"}
          </Button>
        </div>}</div>
      {this.state.myInfo && <div>
        <div id='main'>
          {instructionAccordion}
          {caveatAccordion}
          <div><h3 style={{paddingTop: '30px'}}>Bio</h3>
            <div><small>e.g. 'I don't use this for dating, and I'm mostly looking for female friends'</small></div>
            <ThemeProvider theme={theme}>
            <div><TextField color="secondary" fullWidth multiline value={this.state.bioState || ""}
                            onChange={(e) => this.setState({bioState: e.target.value})}/></div>
            </ThemeProvider>
            
            <div style={{color: "#B6AAA2", fontSize: "0.9em"}}>{300 - (this.state.bioState || "").length} characters
              remaining
            </div>
            <StyledButton style={{marginTop: '2em'}} onClick={() => this.changeMyInfo({bio: this.state.bioState})}
                    variant='contained'
                    disabled={(this.state.bioState === this.state.myInfo.bio) || this.state.bioState.length > 300} disableElevation>Save
              bio</StyledButton>

            <div style={{paddingTop: '30px'}}><label>Visibility settings: {this.state.updatingVisibility && <span>updating...</span>}
              <select style={{'margin': "20px"}} disabled={this.state.updatingVisibility} value={this.state.myVisibilitySetting} onChange={(e) => this.updateVisibility(e.target.value)}>
                <option value='invisible'>Invisible to everyone</option>
                <option value='friends'>Visible just to Reciprocity users who are my Facebook friends</option>
                <option value='everyone'>Visible to everyone on Reciprocity who has checked this option, and also my friends</option>
                </select></label>



                <p style={{margin: '20px', borderStyle: 'solid', backgroundColor: 'rgb(255 160 154)', padding: '20px'}}>Warning: Facebook is very unreliable about providing a full list of your friends. So if you choose the "visible just to reciprocity users who
                  are my Facebook friends" option, you might not see some of your friends who have Reciprocity accounts, and they might also not see you.
                  So my personal recommendation (writing as Buck Shlegeris, the developer of this site) is to select the "visible to everyone" option.
                </p>
              </div>
              
          </div>
          <div>
            {this.state.myVisibilitySetting == 'invisible' ? <p>Set your visibility to something other than 'invisible' in order to see people!</p> :
            <FriendsListView
                myChecks={this.state.myChecks}
                currentChecksState={this.state.currentChecksState}
                friendsList={this.state.friendsList}
                reciprocations={Immutable.Map(this.state.reciprocations).mapEntries(([idStr, x]) =>
                    [parseInt(idStr), Immutable.Set(x)])}
                friendPictures={this.state.friendPictures}
                sendUpdateRequest={(myNewChecks) => this.sendUpdateRequest(myNewChecks)}
                setCheckedState={(id, activity, currChecked) => this.setCheckedState(id, activity, currChecked)}
            />}</div>

        </div>
        <div id='footer'>
          <StyledButton variant="contained" onClick={() => this.submit()} disableElevation>
            Save
          </StyledButton>
        </div>
      </div>}
    </div>
  }

  changeMyInfo(newInfo) {
    fetch('/api/update_user?access_token=' + this.state.accessToken, {
      method: 'POST',
      body: JSON.stringify(newInfo),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }).then(response => response.json())
        .then((myInfo) => {
          this.setState({myInfo: myInfo})
        })
  }

  sendUpdateRequest(myNewChecks) {
    fetch('/api/update_checks?access_token=' + this.state.accessToken, {
      method: 'POST',
      body: JSON.stringify(myNewChecks),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }).then(response => response.json())
        .then(([myChecks, reciprocations]) => {
          // this.
          this.setState({
            myChecks: Immutable.Map(myChecks).mapEntries(([idStr, x]) =>
                [parseInt(idStr), Immutable.Set(x)]), reciprocations: reciprocations
          })
        })
  }

  updateVisibility(newVisibility) {
    this.setState({updatingVisibility: true});
    fetch('/api/update_visibility?access_token=' + this.state.accessToken, {
      method: 'POST',
      body: JSON.stringify({'visibility': newVisibility}),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }).then(response => response.json())
        .then(() => {
          this.fetchInfo();
          
        })
  }


  handleFBLogin(response) {
    if (response.authResponse) {
      const accessToken = response.authResponse.accessToken;

      this.setState({loggingIn: true, accessToken: accessToken}, () => {
        this.fetchInfo();
      });

    } else {
      console.log('User cancelled login or did not fully authorize.');
    }
  }

  fetchInfo() {
    fetch('/api/info?access_token=' + this.state.accessToken).then(response => response.json())
          .then(data => {
            const [myInfo, friendsList, friendPictures, myChecks, reciprocations, myProfilePicUrl] = data;
            const myVisibilitySetting = myInfo.visibility_setting;
            
            const myChecksParsed = Immutable.Map(myChecks).mapEntries(([idStr, x]) =>
                [parseInt(idStr), Immutable.Set(x)])

            this.setState({
              friendsList: friendsList,
              friendPictures: friendPictures,
              myInfo: myInfo,
              myChecks: myChecksParsed,
              currentChecksState: myChecksParsed,
              reciprocations: reciprocations,
              bioState: myInfo.bio,
              myProfilePicUrl: myProfilePicUrl,
              myVisibilitySetting: myVisibilitySetting,
              nameFilter: '',
              updatingVisibility: false,
            });
          })
  }

  setCheckedState(id, activity, currChecked) {
    this.setState({
      currentChecksState:
          this.state.currentChecksState.update(id, Immutable.Set(),
              (currSet) => currChecked ? currSet.remove(activity) : currSet.add(activity))
    })
  }

  submit() {
    this.sendUpdateRequest(this.state.currentChecksState)
  }
}

const urlRegex = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;

class FriendsListView extends React.Component {
  constructor(props) {
    super();
    this.state = {nameFilter: null};
  }


  render() {
    const filterPred = (friend) => {
      return (!this.state.nameFilter || friend.name.toLowerCase().includes(this.state.nameFilter.toLowerCase())) && 
          (!this.state.bioFilter || (friend.bio && friend.bio.toLowerCase().includes(this.state.bioFilter.toLowerCase())));
    }

    return (
        <table id='friend-table'>
          <thead>
          <tr>
            <td><h3>People</h3>
            <div>Name filter: <input value={this.state.nameFilter} onChange={(e) => this.setState({nameFilter: e.target.value})} /></div>
            <div>Bio filter: <input value={this.state.bioFilter} onChange={(e) => this.setState({bioFilter: e.target.value})} /></div></td>
            
            <td>Hang out sometime</td>
            <td>Go on a date or something</td>
            <td>Lick feet</td>
          </tr>
          </thead>
          <tbody>
          {this.props.friendsList.filter((f) => filterPred(f)).map((friend) => {
            return (this.props.reciprocations.get(friend.id, Immutable.Set()).size > 0) && this.renderFriendRow(friend);
          })}
          {this.props.friendsList.filter((f) => filterPred(f)).map((friend) => {
            return (this.props.reciprocations.get(friend.id, Immutable.Set()).size === 0) && this.renderFriendRow(friend);
          })}
          </tbody>
        </table>
    );
  }

  renderFriendRow(friend) {
    const {bio, id, name, fb_id} = friend;
    const currentChecksState = this.props.currentChecksState;
    const QUESTION_MARK = "https://upload.wikimedia.org/wikipedia/commons/d/d9/Icon-round-Question_mark.svg";
    const picUrl = this.props.friendPictures[fb_id]?.data?.url;
    // debugger;
    return <tr key={id}>
      <td>
        <div className='user-td'>
          <img height={50} width={50} alt={`Profile picture for ${name}`}
               style={{borderRadius: "50%", marginRight: '1.25em'}}
               src={picUrl || QUESTION_MARK}/>
          <div>
            <div className='name'>{name}</div>
            <div className='bio'>{(bio || "").split(" ")
                .map(part =>
                  urlRegex.test(part) ? <a href={part}>{part} </a> : part + " "
                )}</div>
          </div>

        </div>
      </td>
      {['hangOut', 'date', 'lickFeet'].map((activity, idx) => {
        const themChecked = this.props.reciprocations.get(id, Immutable.Set()).includes(activity);
        const serverChecked = this.props.myChecks.get(id, Immutable.Set()).includes(activity);
        const currentStateChecked = currentChecksState.get(id, Immutable.Set()).includes(activity);
        const currChecked = currentStateChecked === null ? (serverChecked || false) : currentStateChecked;
        return <td className="check-cell" key={idx}>


          {<StyledCheckbox
              checked={currChecked}
              themChecked={themChecked}
              serverChecked={serverChecked}
              // disabled={themChecked && serverChecked}
              onChange={() => {
                if (!(themChecked && serverChecked)) {
                  this.props.setCheckedState(id, activity, currChecked);
                }

              }}
          />}


        </td>
      })}
    </tr>
  }
}

export default App;
