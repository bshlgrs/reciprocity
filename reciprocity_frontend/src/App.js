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
import Popover from "@material-ui/core/Popover";
import Typography from "@material-ui/core/Typography";

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
    background: '#886B7C',
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
      hueRotation: 0,
      isHueAnimating: false,
      visibilityWarningAnchor: null,
      cssGenerationInstruction: '',
      isGeneratingCSS: false,
      streamOutput: '',
    }
    this.hueAnimationFrame = null;
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

  componentWillUnmount() {
    // Clean up hue animation
    this.stopHueAnimation();
    // Clean up custom CSS
    this.removeCustomCSS();
  }



  startHueAnimation() {
    if (this.hueAnimationFrame) return;
    
    this.setState({ isHueAnimating: true });
    
    const animate = () => {
      if (this.hueAnimationFrame) {
        this.setState(prevState => {
          const newHueRotation = (prevState.hueRotation + 2) % 360;
          document.body.style.filter = `hue-rotate(${newHueRotation}deg)`;
          return { hueRotation: newHueRotation };
        });
        this.hueAnimationFrame = requestAnimationFrame(animate);
      }
    };
    
    this.hueAnimationFrame = requestAnimationFrame(animate);
  }

  stopHueAnimation() {
    this.setState({ isHueAnimating: false });
    if (this.hueAnimationFrame) {
      cancelAnimationFrame(this.hueAnimationFrame);
      this.hueAnimationFrame = null;
    }
  }

  applyCustomCSS(cssString) {

    document.body.style.filter = '';

    // Remove existing custom CSS if it exists
    this.removeCustomCSS();
    
    if (cssString && cssString.trim()) {
      // Create a new style element
      const styleElement = document.createElement('style');
      styleElement.id = 'user-custom-css';
      styleElement.textContent = cssString;
      document.head.appendChild(styleElement);
    }
  }

  removeCustomCSS() {
    const existingStyle = document.getElementById('user-custom-css');
    if (existingStyle) {
      existingStyle.remove();
    }
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
          <StyledButton onClick={() => window.FB.logout(() => window.location.reload())} variant="contained" disableElevation>Log
            out</StyledButton>
          {/*<Button onClick={() => this.deleteAccount()}>Delete account</Button>*/}
          <div style={{marginTop: "0.25em", fontStyle: 'italic'}}><span
              style={{color: "rgb(118 255 22)"}}>Signed in as</span>
            <img height={25} width={25} alt={`Your profile pic`}
                 style={{borderRadius: "50%", marginRight: '.25em', marginLeft: '.5em'}}
                 src={this.state.myProfilePicUrl}/>
            {this.state.myInfo.name}</div>
        </div>}</div>
        <h1>reciprocity.pro</h1>
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
          <Button 
            color="primary" 
            variant="contained" 
            disabled={this.state.loggingIn} 
            className={this.state.loggingIn ? "unhinged-login" : ""}
            onClick={() => {
              this.startHueAnimation();
              window.FB.login((resp) => this.handleFBLogin(resp), {scope: 'user_friends,email'});
            }}
          >
            {this.state.loggingIn ? "Logging in..." : "Log in with Facebook"}
          </Button>
        </div>}</div>
      {this.state.myInfo && <div>
        <div id='main'>
          {instructionAccordion}
          
          <Accordion style={{marginTop: '30px'}}>
            <AccordionSummary
                aria-controls="panel2a-content"
                id="panel2a-header"
            >
              User Settings
            </AccordionSummary>
            <AccordionDetails style={{display: 'block'}}>
              <div><h3 style={{fontSize: '1.1em'}}>Bio</h3>
                <div><small>e.g. 'I don't use this for dating, and I'm mostly looking for female friends'</small></div>
                <ThemeProvider theme={theme}>
                <div><TextField color="secondary" fullWidth multiline value={this.state.bioState || ""}
                                onChange={(e) => this.setState({bioState: e.target.value})}/></div>
                </ThemeProvider>
                
                <div style={{
                  color: (this.state.bioState || "").length > 300 ? "#d32f2f" : "#B6AAA2", 
                  fontSize: "0.9em"
                }}>
                  {(this.state.bioState || "").length}/300
                </div>
              </div>

              <div style={{paddingTop: '30px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap'}}>
                  <label style={{fontWeight: 'bold', fontSize: '1.1em'}}>
                    Visibility settings: 
                    <span 
                      style={{color: '#d32f2f', cursor: 'pointer', textDecoration: 'underline', marginLeft: '5px', display: 'inline-flex', alignItems: 'center', gap: '3px'}}
                      onClick={(e) => this.setState({visibilityWarningAnchor: e.currentTarget})}
                    >
                      ℹ️ see warning
                    </span>
                  </label>
                  {this.state.updatingVisibility && <span style={{fontStyle: 'italic'}}>updating...</span>}
                  <select 
                    style={{padding: '5px 10px', fontSize: '14px'}} 
                    disabled={this.state.updatingVisibility} 
                    value={this.state.myVisibilitySetting} 
                    onChange={(e) => this.updateVisibility(e.target.value)}
                  >
                    <option value='invisible'>Invisible to everyone</option>
                    <option value='friends'>Visible just to Reciprocity users who are my Facebook friends</option>
                    <option value='everyone'>Visible to everyone on Reciprocity who has checked this option, and also my friends</option>
                  </select>
                </div>
                
                <Popover
                  open={Boolean(this.state.visibilityWarningAnchor)}
                  anchorEl={this.state.visibilityWarningAnchor}
                  onClose={() => this.setState({visibilityWarningAnchor: null})}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                >
                  <div style={{padding: '20px', maxWidth: '400px', backgroundColor: 'rgb(255 160 154)'}}>
                    <Typography variant="body2">
                      Facebook is unreliable about providing a full list of your friends. 
                      So if you choose the "visible just to reciprocity users who are my Facebook friends" option, 
                      you might not see some of your friends who have Reciprocity accounts, and they might also not see you.
                      The official recommendation of reciprocity.pro is to select the "visible to everyone" option.
                    </Typography>
                  </div>
                </Popover>
              </div>
                
            <div style={{paddingTop: '30px'}}>
              <div>
                <small>
                  By entering your number, you agree to receive text notifications when you match with someone.
                </small>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px'}}>
                <label style={{fontWeight: 'bold', fontSize: '1.1em'}}>Phone Number:</label>
                <ThemeProvider theme={theme}>
                  <TextField
                    color="secondary"
                    style={{width: '200px'}}
                    value={this.state.phoneNumberState !== undefined ? this.state.phoneNumberState : (this.state.myInfo.phone_number || "")}
                    onChange={(e) => this.setState({phoneNumberState: e.target.value})}
                    placeholder="Enter your phone number"
                    inputProps={{ maxLength: 20 }}
                  />
                </ThemeProvider>
              </div>
              <div style={{
                color: ((this.state.phoneNumberState !== undefined ? this.state.phoneNumberState : (this.state.myInfo.phone_number || "")).length > 20) ? "#d32f2f" : "#B6AAA2", 
                fontSize: "0.9em", 
                marginTop: '5px'
              }}>
                {(this.state.phoneNumberState !== undefined ? this.state.phoneNumberState : (this.state.myInfo.phone_number || "")).length}/20
              </div>
            </div>

            <div style={{paddingTop: '30px'}}>
              <div>
                <small>
                  Link to your dating doc or profile (optional).
                </small>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px'}}>
                <label style={{fontWeight: 'bold', fontSize: '1.1em'}}>Dating Doc Link:</label>
                <ThemeProvider theme={theme}>
                  <TextField
                    color="secondary"
                    style={{width: '300px'}}
                    value={this.state.datingDocLinkState !== undefined ? this.state.datingDocLinkState : (this.state.myInfo.dating_doc_link || "")}
                    onChange={(e) => this.setState({datingDocLinkState: e.target.value})}
                    placeholder="Enter URL (e.g., https://docs.google.com/...)"
                    inputProps={{ maxLength: 500 }}
                  />
                </ThemeProvider>
              </div>
              <div style={{
                color: ((this.state.datingDocLinkState ? this.state.datingDocLinkState : (this.state.myInfo.dating_doc_link || "")).length > 500) ? "#d32f2f" : "#B6AAA2", 
                fontSize: "0.9em", 
                marginTop: '5px'
              }}>
                {(this.state.datingDocLinkState ? this.state.datingDocLinkState : (this.state.myInfo.dating_doc_link || "")).length}/500
              </div>
            </div>

            <div style={{paddingTop: '30px'}}>
              <div style={{display: 'flex', gap: '10px', marginTop: '1em'}}>
                <StyledButton
                  style={{marginTop: '1em', background: '#dc3545'}}
                  onClick={() => this.setState({customCssState: ""})}
                  variant='contained'
                  disableElevation
                >
                  Clear custom style
                </StyledButton>
              </div>
            </div>

            <div style={{paddingTop: '30px', textAlign: 'center', borderTop: '1px solid #ddd', marginTop: '30px'}}>
              <StyledButton
                style={{fontSize: '1.1em', padding: '12px 30px'}}
                onClick={() => this.saveAllUserSettings()}
                variant='contained'
                disabled={!this.hasUserSettingsChanges()}
                disableElevation
              >
                Save Changes
              </StyledButton>
            </div>
            </AccordionDetails>
          </Accordion>
          
          <Accordion style={{marginTop: '30px'}}>
            <AccordionSummary
                aria-controls="panel3a-content"
                id="panel3a-header"
            >
              Do you have a problem with the graphic design of this website
            </AccordionSummary>
            <AccordionDetails style={{display: 'block'}}>
              <div style={{marginBottom: '20px', fontSize: '1.1em'}}>
                Ok, well what did you want?
              </div>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                <input
                  type="text"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    border: '2px solid #886B7C',
                    borderRadius: '4px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  value={this.state.cssGenerationInstruction}
                  onChange={(e) => this.setState({cssGenerationInstruction: e.target.value})}
                  placeholder="the kind of style that was cool in 2004"
                  disabled={this.state.isGeneratingCSS}
                />
                <div style={{display: 'flex', gap: '10px'}}>
                  <StyledButton
                    onClick={() => this.generateCustomCSS()}
                    variant='contained'
                    disabled={this.state.isGeneratingCSS || !this.state.cssGenerationInstruction.trim()}
                    disableElevation
                    style={{background: this.state.isGeneratingCSS ? '#ccc' : '#28a745'}}
                  >
                    {this.state.isGeneratingCSS ? 'considering...' : 'submit dumb suggestion'}
                  </StyledButton>
                </div>
                
              </div>
            </AccordionDetails>
          </Accordion>
          
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

  async generateCustomCSS() {
    if (!this.state.cssGenerationInstruction.trim()) {
      this.setState({ 
        streamOutput: '❌ Please enter an instruction first\n' 
      });
      return;
    }

    // Disable the background animation by removing the animation style from the body
    const body = document.body;
    if (body) {
      body.style.animation = 'none';
      body.style.backgroundPosition = '';
    }

    this.setState({ 
      isGeneratingCSS: true,
      streamOutput: `🎨 Starting CSS generation: "${this.state.cssGenerationInstruction}"\n${'─'.repeat(50)}\n`
    });

    try {
      // Step 1: Start CSS generation
      const response = await fetch(`/api/generate_css?access_token=${this.state.accessToken}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instruction: this.state.cssGenerationInstruction
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const sessionId = data.session_id;
      
      if (!sessionId) {
        throw new Error('No session ID received');
      }

      this.setState(prevState => ({
        streamOutput: prevState.streamOutput + `✅ Generation started! Session: ${sessionId.substring(0, 8)}...\n🔄 Polling for updates every 2 seconds...\n\n`
      }));

      // Step 2: Poll for updates
      let pollCount = 0;
      let totalContent = '';
      
      const pollForUpdates = async () => {
        try {
          pollCount++;
          const pollResponse = await fetch(`/api/poll_css/${sessionId}`);
          
          if (!pollResponse.ok) {
            throw new Error(`Poll failed: HTTP ${pollResponse.status}`);
          }
          
          const pollData = await pollResponse.json();
          const { content, done, error } = pollData;
          
          if (error) {
            this.setState(prevState => ({
              streamOutput: prevState.streamOutput + `❌ Error: ${error}\n`,
              isGeneratingCSS: false
            }));
            return;
          }
          
          if (content) {
            this.setState(prevState => ({
              streamOutput: prevState.streamOutput + content
            }));
            totalContent += content;
          }
          
          if (done) {
            this.setState(prevState => ({
              streamOutput: prevState.streamOutput + (content || "") + `\n${'─'.repeat(50)}\n🏁 Generation finished!\n📝 Complete CSS (${totalContent.length} characters)\n💾 Saving CSS to your profile...\n`,
              isGeneratingCSS: false
            }), () => {
              // Save the generated CSS to the user's profile
              this.saveAllUserSettings();
            });
            return;
          }
          
          // Grep for ```css blocks in totalContent and update custom CSS state
          const cssBlockRegex = /```css\s*([\s\S]*?)```/g;
          let match;
          let lastCss = null;
          let foundUnfinishedCss = false;

          // Find all complete ```css ... ``` blocks
          while ((match = cssBlockRegex.exec(totalContent)) !== null) {
            lastCss = match[1];
          }

          // If no complete block, but there's an opening ```css, try to get partial CSS up to last close brace
          if (lastCss === null) {
            // Look for an opening ```css
            const cssStartIdx = totalContent.lastIndexOf('```css');
            if (cssStartIdx !== -1) {
              // Get everything after the last ```css
              const cssContent = totalContent.slice(cssStartIdx + 6); // 6 = length of '```css'
              // Find the last close brace after a newline (to ensure we only include complete rules)
              // This will match the last occurrence of '}\n' or '}\r\n'
              const lastCloseBraceMatch = cssContent.match(/[\s\S]*?(\n[ \t]*\})/g);
              if (lastCloseBraceMatch) {
                // Find the last occurrence of a close brace at the start of a line
                const lastCloseBraceIdx = cssContent.lastIndexOf('}\n');
                let cssUpTo = -1;
                if (lastCloseBraceIdx !== -1) {
                  cssUpTo = lastCloseBraceIdx + 2; // include the close brace and newline
                } else {
                  // Try Windows line endings
                  const lastCloseBraceRNIdx = cssContent.lastIndexOf('}\r\n');
                  if (lastCloseBraceRNIdx !== -1) {
                    cssUpTo = lastCloseBraceRNIdx + 3;
                  }
                }
                if (cssUpTo > 0) {
                  lastCss = cssContent.slice(0, cssUpTo);
                  foundUnfinishedCss = true;
                }
              } else {
                // fallback: just up to last close brace anywhere
                const lastCloseBraceIdx = cssContent.lastIndexOf('}');
                if (lastCloseBraceIdx !== -1) {
                  lastCss = cssContent.slice(0, lastCloseBraceIdx + 1);
                  foundUnfinishedCss = true;
                }
              }
            }
          }

          if (lastCss !== null) {
            // Update the custom CSS state directly and apply it immediately
            this.setState({ customCssState: lastCss });
            this.applyCustomCSS(lastCss);
          }
          // Continue polling if not done
          setTimeout(pollForUpdates, 2000);
          
        } catch (error) {
          this.setState(prevState => ({
            streamOutput: prevState.streamOutput + `💥 Polling error: ${error}\n`,
            isGeneratingCSS: false
          }));
        }
      };
      
      // Start polling
      setTimeout(pollForUpdates, 1000); // First poll after 1 second

    } catch (error) {
      this.setState(prevState => ({
        streamOutput: prevState.streamOutput + `💥 Failed to start CSS generation: ${error}\n`,
        isGeneratingCSS: false
      }));
    }
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
          this.setState({myInfo: myInfo});
          // Apply custom CSS if it was updated
          if (newInfo.custom_css !== undefined) {
            this.applyCustomCSS(myInfo.custom_css);
          }
        })
  }

  saveAllUserSettings() {
    const changes = {};
    
    // Check each field and add to changes if it has been modified
    if (this.state.bioState !== this.state.myInfo.bio) {
      changes.bio = this.state.bioState;
    }
    
    if (this.state.phoneNumberState !== undefined && 
        this.state.phoneNumberState !== (this.state.myInfo.phone_number || "")) {
      changes.phone_number = this.state.phoneNumberState;
    }
    
    if (this.state.datingDocLinkState !== undefined && 
        this.state.datingDocLinkState !== (this.state.myInfo.dating_doc_link || "")) {
      changes.dating_doc_link = this.state.datingDocLinkState;
    }
    
    if (this.state.customCssState !== undefined && 
        this.state.customCssState !== (this.state.myInfo.custom_css || "")) {
      changes.custom_css = this.state.customCssState;
    }
    
    // Only make the API call if there are actual changes
    if (Object.keys(changes).length > 0) {
      this.changeMyInfo(changes);
    }
  }

  hasUserSettingsChanges() {
    // Check if bio has changed
    if (this.state.bioState !== this.state.myInfo.bio) {
      // Also check if bio is within length limit
      if ((this.state.bioState || "").length <= 300) {
        return true;
      }
    }
    
    // Check if phone number has changed
    if (this.state.phoneNumberState !== undefined && 
        this.state.phoneNumberState !== (this.state.myInfo.phone_number || "")) {
      // Also check if phone number is within length limit
      if ((this.state.phoneNumberState || "").length <= 20) {
        return true;
      }
    }
    
    // Check if dating doc link has changed
    if (this.state.datingDocLinkState !== undefined && 
        this.state.datingDocLinkState !== (this.state.myInfo.dating_doc_link || "")) {
      // Also check if dating doc link is within length limit
      if ((this.state.datingDocLinkState || "").length <= 500) {
        return true;
      }
    }
    
    // Check if custom CSS has changed
    if (this.state.customCssState !== undefined && 
        this.state.customCssState !== (this.state.myInfo.custom_css || "")) {
      // Also check if custom CSS is within length limit
      if ((this.state.customCssState || "").length <= 20000) {
        return true;
      }
    }
    
    return false;
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
      this.stopHueAnimation();
    }
  }

  fetchInfo() {
    fetch('/api/info?access_token=' + this.state.accessToken).then(response => response.json())
          .then(data => {
            const [myInfo, friendsList, friendPictures, myChecks, reciprocations, myProfilePicUrl] = data;
            const myVisibilitySetting = myInfo.visibility_setting;
            
            // For testing: randomly add dating doc links to half the friends
            const testDatingDocs = [
              'https://docs.google.com/document/d/1abc123/edit',
              'https://docs.google.com/document/d/1def456/edit',
              'https://docs.google.com/document/d/1ghi789/edit',
              'https://docs.google.com/document/d/1jkl012/edit',
              'https://docs.google.com/document/d/1mno345/edit',
              'https://docs.google.com/document/d/1pqr678/edit',
              'https://docs.google.com/document/d/1stu901/edit',
              'https://docs.google.com/document/d/1vwx234/edit'
            ];
            
            const friendsListWithTestDatingDocs = friendsList.map(friend => {
              // Randomly assign dating docs to ~50% of friends
              if (Math.random() > 0.5) {
                const randomDoc = testDatingDocs[Math.floor(Math.random() * testDatingDocs.length)];
                return { ...friend, dating_doc_link: randomDoc };
              }
              return friend;
            });
            
            const myChecksParsed = Immutable.Map(myChecks).mapEntries(([idStr, x]) =>
                [parseInt(idStr), Immutable.Set(x)])

            this.setState({
              friendsList: friendsListWithTestDatingDocs,
              friendPictures: friendPictures,
              myInfo: myInfo,
              myChecks: myChecksParsed,
              currentChecksState: myChecksParsed,
              reciprocations: reciprocations,
              bioState: myInfo.bio,
              datingDocLinkState: myInfo.dating_doc_link,
              customCssState: myInfo.custom_css,
              myProfilePicUrl: myProfilePicUrl,
              myVisibilitySetting: myVisibilitySetting,
              nameFilter: '',
              updatingVisibility: false,
            });
            
            // Apply custom CSS if it exists
            if (myInfo.custom_css) {
              this.applyCustomCSS(myInfo.custom_css);
            }
            
            // Stop hue animation when login is successful
            this.stopHueAnimation();
          })
          .catch(error => {
            console.error('Login failed:', error);
            // Stop hue animation if login fails
            this.stopHueAnimation();
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

const urlRegex = /http\S*/gi;

class FriendsListView extends React.Component {
  constructor(props) {
    super();
    this.state = {
      nameFilter: null,
      itemsToShow: 20, // Start with showing 10 items
      itemsPerPage: 20  // Load 10 more items each time
    };
  }


  loadMoreItems = () => {
    this.setState(prevState => ({
      itemsToShow: prevState.itemsToShow + prevState.itemsPerPage
    }));
  }

  resetPagination = () => {
    this.setState({ itemsToShow: this.state.itemsPerPage });
  }

  render() {
    const filterPred = (friend) => {
      return (!this.state.nameFilter || friend.name.toLowerCase().includes(this.state.nameFilter.toLowerCase())) && 
          (!this.state.bioFilter || (friend.bio && friend.bio.toLowerCase().includes(this.state.bioFilter.toLowerCase())));
    }

    // Filter friends first
    const filteredFriends = this.props.friendsList.filter(filterPred);
    
    // Separate friends with reciprocations > 0 and friends with reciprocations === 0
    const friendsWithReciprocations = filteredFriends.filter(friend => 
      this.props.reciprocations.get(friend.id, Immutable.Set()).size > 0
    );
    const friendsWithoutReciprocations = filteredFriends.filter(friend => 
      this.props.reciprocations.get(friend.id, Immutable.Set()).size === 0
    );
    
    // Combine them with reciprocating friends first
    const sortedFriends = [...friendsWithReciprocations, ...friendsWithoutReciprocations];
    
    // Apply pagination
    const friendsToShow = sortedFriends.slice(0, this.state.itemsToShow);
    const hasMoreItems = sortedFriends.length > this.state.itemsToShow;

    return (
        <div>
          <table id='friend-table'>
            <thead>
            <tr>
              <td style={{paddingLeft: '20px'}}><h3>People</h3>
              <div>Name filter: <input 
                value={this.state.nameFilter || ''} 
                onChange={(e) => this.setState({nameFilter: e.target.value}, this.resetPagination)} 
              /></div>
              <div>Bio filter: <input 
                value={this.state.bioFilter || ''} 
                onChange={(e) => this.setState({bioFilter: e.target.value}, this.resetPagination)} 
              /></div>
              <div style={{fontSize: '0.9em', color: '#666', marginTop: '10px'}}>
                Showing {friendsToShow.length} of {sortedFriends.length} people
              </div>
              </td>
              
              <td style={{width: '150px', textAlign: 'center'}}>Hang out sometime</td>
              <td style={{width: '150px', textAlign: 'center'}}>Go on a date or something</td>
              <td style={{width: '150px', textAlign: 'center'}}>Lick feet</td>
            </tr>
            </thead>
            <tbody>
            {friendsToShow.map((friend, idx) => this.renderFriendRow(friend, idx))}
            </tbody>
          </table>
          
          {hasMoreItems && (
            <div style={{textAlign: 'center', margin: '20px 0'}}>
              <StyledButton 
                variant="outlined" 
                onClick={this.loadMoreItems}
                style={{
                  background: 'transparent',
                  color: '#886B7C',
                  border: '2px solid #886B7C',
                  '&:hover': {
                    backgroundColor: '#886B7C',
                    color: 'white'
                  }
                }}
              >
                Load More ({sortedFriends.length - this.state.itemsToShow} remaining)
              </StyledButton>
            </div>
          )}
        </div>
    );
  }

  renderFriendRow(friend, idx) {
    const {bio, id, name, fb_id} = friend;
    const currentChecksState = this.props.currentChecksState;
    const QUESTION_MARK = "https://upload.wikimedia.org/wikipedia/commons/d/d9/Icon-round-Question_mark.svg";
    const picUrl = this.props.friendPictures[fb_id]?.data?.url;
    // debugger;
    return <tr key={idx}>
      <td>
        <div className='user-td'>
          <div>
            <div className='name'>
              {name}
              {friend.dating_doc_link && (
                <span 
                  style={{
                    marginLeft: '8px', 
                    cursor: 'pointer', 
                    fontSize: '1.2em',
                    textDecoration: 'none'
                  }}
                  onClick={() => window.open(friend.dating_doc_link, '_blank')}
                  title="Open dating doc"
                >
                  ℹ️
                </span>
              )}
            </div>
            <div className='bio'>{(bio || "").split(" ")
                .map((part, idx) =>
                  urlRegex.test(part) ? <a key={idx} href={part}>{part} </a> : part + " "
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
