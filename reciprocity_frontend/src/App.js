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

import { createMuiTheme } from '@material-ui/core/styles'
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

const disabledTheme = createMuiTheme({
  palette: {
    action: {
      disabledBackground: lightGreen[600],
      // disabled: 'set color of text here'
    }
  }
});

const StyledCheckbox = withStyles(greenStyle)((props) => {
  const {serverChecked, themChecked, ...otherProps} = props;
  return <Checkbox color="default" {...otherProps} />


});

const instructionAccordion = <Accordion>
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
      <Button style={{marginLeft: "0.5em"}} variant="contained">Save
      </Button>.
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
          There is no way to delete an account. I'm trying to fix this. If you want to delete your account, message me.
        </li>
        <li>
          When you match with someone, it doesn't send you an email, it just shows you the green tick.
        </li>
        <li>
          This site is, uh, hosted on my laptop and will break if I ever turn my laptop off. I plan to deploy the app
          server
          somewhere else eventually, obviously.
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
      myProfilePicUrl: null
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
              style={{color: "#C3B7B0"}}>Signed in as</span>
            <img height={25} width={25} alt={`User's profile picture`}
                 style={{borderRadius: "50%", marginRight: '.25em', marginLeft: '.5em'}}
                 src={this.state.myProfilePicUrl}/>
            {this.state.myInfo.name}</div>
        </div>}</div>
        <h1>reciprocity.io</h1>
        <div style={{color: "#D2CBC7", fontWeight: '700', fontSize: "1.5em"}}>
          what would you do, if they wanted to too?
        </div>

        {!this.state.myInfo &&
        <div id='main'>
          <div>
            <div>You check boxes</div>
            <div>Your friends check boxes</div>
            <div>You see when you've checked each other's boxes</div>
          </div>
          <Button color="primary" variant="contained" onClick={() => {
            window.FB.login((resp) => this.handleFBLogin(resp), {scope: 'user_friends,email'});
          }}>Log in with Facebook
          </Button></div>}</div>
      {this.state.myInfo && <div>
        <div id='main'>
          {instructionAccordion}
          {caveatAccordion}
          <div><h3>Bio</h3>
            <div><small>e.g. 'I don't use this for dating, and I'm mostly looking for female friends'</small></div>
            <div><TextField fullWidth multiline value={this.state.bioState || ""}
                            onChange={(e) => this.setState({bioState: e.target.value})}/></div>
            <div style={{color: "#B6AAA2", fontSize: "0.9em"}}>{300 - (this.state.bioState || "").length} characters
              remaining
            </div>
            <Button style={{marginTop: '2em'}} onClick={() => this.changeMyInfo({bio: this.state.bioState})}
                    variant='contained'
                    disabled={(this.state.bioState === this.state.myInfo.bio) || this.state.bioState.length > 300}>Save
              bio</Button>
          </div>
          <div>
            <FriendsListView
                myChecks={this.state.myChecks}
                currentChecksState={this.state.currentChecksState}
                friendsList={this.state.friendsList}
                reciprocations={Immutable.Map(this.state.reciprocations).mapEntries(([idStr, x]) =>
                    [parseInt(idStr), Immutable.Set(x)])}
                friendPictures={this.state.friendPictures}
                sendUpdateRequest={(myNewChecks) => this.sendUpdateRequest(myNewChecks)}
                setCheckedState={(id, activity, currChecked) => this.setCheckedState(id, activity, currChecked)}
            /></div>

        </div>
        <div id='footer'>
          <Button variant="contained" onClick={() => this.submit()}>
            Save
          </Button>
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

  handleFBLogin(response) {
    if (response.authResponse) {
      const accessToken = response.authResponse.accessToken;
      console.log('things probably worked, access token ' + accessToken);
      fetch('/api/info?access_token=' + accessToken).then(response => response.json())
          .then(data => {
            const [myInfo, friendsList, friendPictures, myChecks, reciprocations, myProfilePicUrl] = data;
            const myChecksParsed = Immutable.Map(myChecks).mapEntries(([idStr, x]) =>
                [parseInt(idStr), Immutable.Set(x)])

            this.setState({
              accessToken: accessToken,
              friendsList: friendsList,
              friendPictures: friendPictures,
              myInfo: myInfo,
              myChecks: myChecksParsed,
              currentChecksState: myChecksParsed,
              reciprocations: reciprocations,
              bioState: myInfo.bio,
              myProfilePicUrl: myProfilePicUrl
            });
          })
    } else {
      console.log('User cancelled login or did not fully authorize.');
    }
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

class FriendsListView extends React.Component {
  constructor(props) {
    super();
  }


  render() {
    return (
        <table id='friend-table'>
          <thead>
          <tr>
            <td><h3>Friends</h3></td>
            <td>Hang out sometime</td>
            <td>Go on a date or something</td>
          </tr>
          </thead>
          <tbody>
          {this.props.friendsList.map((friend) => {
            return (this.props.reciprocations.get(friend.id, Immutable.Set()).size > 0) && this.renderFriendRow(friend);
          })}
          {this.props.friendsList.map((friend) => {
            return (this.props.reciprocations.get(friend.id, Immutable.Set()).size === 0) && this.renderFriendRow(friend);
          })}
          </tbody>
        </table>
    );
  }

  renderFriendRow(friend) {
    const {bio, id, name, fb_id} = friend;
    const currentChecksState = this.props.currentChecksState;

    return <tr key={id}>
      <td>
        <div className='user-td'>
          <img height={50} width={50} alt={`Profile picture for ${name}`}
               style={{borderRadius: "50%", marginRight: '1.25em'}}
               src={this.props.friendPictures[fb_id].data.url}/>
          <div>
            <div className='name'>{name}</div>
            <div className='bio'>{bio}</div>
          </div>

        </div>
      </td>
      {['hangOut', 'date'].map((activity, idx) => {
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