import './App.css';
import React from 'react';
import { Map, Set } from 'immutable';
// Custom Checkbox Component
const StyledCheckbox = (props) => {
  const {serverChecked, themChecked, checked, onChange, disabled} = props;
  
  const getCheckboxClassName = () => {
    let className = '';
    
    if (themChecked) {
      className = 'checkbox-them-checked';
    } else if (serverChecked) {
      className = 'checkbox-server-checked';
    } else {
      className = 'checkbox-default';
    }
    
    className += disabled ? ' checkbox-disabled' : ' checkbox-enabled';
    
    return className;
  };

  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className={getCheckboxClassName()}
    />
  );
};

// Custom TextField Component
const CustomTextField = (props) => {
  const {fullWidth, multiline, value, onChange, placeholder, style, inputProps, ...otherProps} = props;
  
  const baseStyle = {
    padding: '8px 12px',
    border: '1px solid #886B7C',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    ...(fullWidth && {width: '100%'}),
    ...(style || {})
  };

  const focusStyle = {
    borderColor: '#886B7C',
    boxShadow: '0 0 0 2px rgba(136, 107, 124, 0.2)'
  };

  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{...baseStyle, minHeight: '60px', resize: 'vertical', width: '70%'}}
        {...inputProps}
        {...otherProps}
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={baseStyle}
      {...inputProps}
      {...otherProps}
    />
  );
};

// Custom Accordion Component
const CustomAccordion = ({children, style}) => {
  return (
    <div style={{border: '1px solid #ddd', borderRadius: '4px', ...style}}>
      {children}
    </div>
  );
};

const CustomAccordionSummary = ({children, onClick, isOpen}) => {
  return (
    <div
      onClick={onClick}
      className={`accordion-summary ${isOpen ? 'open' : 'closed'}`}
    >
      <span style={{marginRight: '8px'}}>{isOpen ? '▼' : '▶'}</span>
      {children}
    </div>
  );
};

const CustomAccordionDetails = ({children, isOpen}) => {
  if (!isOpen) return null;
  
  return (
    <div style={{padding: '16px'}}>
      {children}
    </div>
  );
};

// Custom Popover Component
const CustomPopover = ({open, anchorEl, onClose, children, anchorOrigin, transformOrigin}) => {
  if (!open || !anchorEl) return null;

  const rect = anchorEl.getBoundingClientRect();
  const popoverStyle = {
    position: 'fixed',
    top: rect.bottom + 8,
    left: rect.left,
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    zIndex: 1000
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'transparent',
          zIndex: 999
        }}
        onClick={onClose}
      />
      <div style={popoverStyle}>
        {children}
      </div>
    </>
  );
};

// Custom Modal Component
const CustomModal = ({open, onClose, children, title}) => {
  if (!open) return null;

  return (
    <>
      <div
        className="modal-backdrop"
        onClick={onClose}
      />
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 className="modal-title">
            {title}
          </h2>
        )}
        {children}
      </div>
    </>
  );
};

// Responsive Header Cell Component
const ResponsiveHeaderCell = ({ fullText, abbreviation, style = {} }) => {
  const [isSmallScreen, setIsSmallScreen] = React.useState(window.innerWidth < 768);
  const [popoverAnchor, setPopoverAnchor] = React.useState(null);

  React.useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cellStyle = {
    textAlign: 'center',
    ...(isSmallScreen ? { width: '40px' } : { width: '90px' }),
    ...style
  };

  if (isSmallScreen) {
    return (
      <>
        <td 
          style={cellStyle}
          onMouseEnter={(e) => setPopoverAnchor(e.currentTarget)}
          onMouseLeave={() => setPopoverAnchor(null)}
        >
          {abbreviation}
        </td>
        <CustomPopover
          open={Boolean(popoverAnchor)}
          anchorEl={popoverAnchor}
          onClose={() => setPopoverAnchor(null)}
        >
          <div style={{ padding: '8px 12px', fontSize: '14px' }}>
            {fullText}
          </div>
        </CustomPopover>
      </>
    );
  }

  return (
    <td style={cellStyle}>
      {fullText}
    </td>
  );
};

// Instructions Accordion Component
const InstructionAccordion = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  return (
    <CustomAccordion style={{marginTop: '50px'}}>
      <CustomAccordionSummary onClick={() => setIsOpen(!isOpen)} isOpen={isOpen}>
        Show instructions
      </CustomAccordionSummary>
      <CustomAccordionDetails isOpen={isOpen}>
        <div style={{display: 'block'}}>
          <div>
            Select things you would do with people.
            ( <StyledCheckbox
              checked={true}
              readOnly={true}
              themChecked={false}
              serverChecked={false}/> = unsaved selection )
          </div>

          <div>
            Press "Submit checks" to submit your selections.
          </div>

          <div>
            Find out if they reciprocate.

            ( <StyledCheckbox
              checked={true}
              readOnly={true}
              themChecked={true}
              serverChecked={true}/> = yes,
            <StyledCheckbox
                checked={true}
                readOnly={true}
                themChecked={false}
                serverChecked={true}/> = no (yet) )
          </div>

          <div>
            If they never reciprocate, nobody knows you tried!
          </div>

          <div>
            If they do, you can do the thing!
          </div>
        </div>
      </CustomAccordionDetails>
    </CustomAccordion>
  );
};

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
      privateContactInfoState: undefined,
      nameFilter: '',
      updatingVisibility: false,
      hueRotation: 0,
      isHueAnimating: false,
      visibilityWarningAnchor: null,
      cssGenerationInstruction: '',
      isGeneratingCSS: false,
      streamOutput: '',
      // Accordion states
      userSettingsOpen: false,
      designAccordionOpen: false,
      // Modal state for first login since reboot
      showWelcomeBackModal: false,
      // Subtitle animation state
      currentSubtitle: '',
      isAnimatingSubtitle: false,
      // Responsive state
      isMobileView: window.innerWidth <= 768,
      isSmallMobile: window.innerWidth <= 480,
      // Manifold probability
      manifoldProbability: null,
    }
    this.hueAnimationFrame = null;
    this.subtitleAnimationTimeout = null;
  }

  componentDidMount() {
    // Better Facebook SDK initialization
    this.initializeFacebookSDK();

    // Add resize listener for responsive behavior
    this.handleResize = () => {
      this.setState({
        isMobileView: window.innerWidth <= 768,
        isSmallMobile: window.innerWidth <= 480,
      });
    };
    window.addEventListener('resize', this.handleResize);

    fetch('/api/get_tagline')
      .then(response => response.text())
      .then(data => {
        this.setState({ currentSubtitle: data });
      });

    // Fetch probability from Manifold Markets API
    fetch('https://api.manifold.markets/v0/market/p5PO2PyUA0')
      .then(response => response.json())
      .then(data => {
        this.setState({ manifoldProbability: data.probability });
      })
      .catch(error => {
        console.error('Failed to fetch Manifold probability:', error);
      });

    this.cssPollingInterval = window.setInterval(async () => {
      if (this.state.isGeneratingCSS) return;
      try {
        const resp = await fetch('/api/global_css.css');
        if (!resp.ok) throw new Error('Failed to fetch global CSS');
        const data = await resp.text();
        this.setState({ customCssState: data });
        this.applyCustomCSS(data);

        
      } catch (err) {
        console.log('Error loading global custom CSS.', err);
      }
    }, 5000);

    this.taglinePollingInterval = window.setInterval(async () => {
      if (this.state.isAnimatingSubtitle) return;
      try {
        const resp = await fetch('/api/get_tagline');
        if (!resp.ok) throw new Error('Failed to fetch tagline');
        const data = await resp.text();
        if (data && data !== this.state.currentSubtitle) {
          this.animateSubtitleChange(data);
        }
      } catch (err) {
        console.error('Error loading tagline:', err);
      }
    }, 5000);

  }

  initializeFacebookSDK() {
    // Check if FB is already available
    if (window.FB) {
      window.FB.getLoginStatus((resp) => this.handleFBLogin(resp));
      return;
    }

    // Wait for Facebook SDK to initialize
    if (window.fbAsyncInit) {
      const originalInit = window.fbAsyncInit;
      window.fbAsyncInit = function() {
        originalInit();
        // SDK is now ready
        window.FB.getLoginStatus((resp) => this.handleFBLogin(resp));
      }.bind(this);
    } else {
      // Fallback: poll for FB object with a maximum number of retries
      let retries = 0;
      const maxRetries = 50; // 5 seconds max wait
      const checkFB = () => {
        if (window.FB) {
          window.FB.getLoginStatus((resp) => this.handleFBLogin(resp));
        } else if (retries < maxRetries) {
          retries++;
          setTimeout(checkFB, 100);
        } else {
          console.warn('Facebook SDK failed to load after 5 seconds');
        }
      };
      checkFB();
    }
  }

  componentWillUnmount() {
    // Clean up hue animation
    this.stopHueAnimation();
    // Clean up custom CSS
    this.removeCustomCSS();
    // Clean up subtitle animation
    if (this.subtitleAnimationTimeout) {
      clearTimeout(this.subtitleAnimationTimeout);
    }
    // Clean up CSS polling interval
    if (this.cssPollingInterval) {
      clearInterval(this.cssPollingInterval);
    }
    // Clean up tagline polling interval
    if (this.taglinePollingInterval) {
      clearInterval(this.taglinePollingInterval);
    }
    // Clean up resize listener
    if (this.handleResize) {
      window.removeEventListener('resize', this.handleResize);
    }
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

  startSubtitleBackspace() {
    if (this.state.isAnimatingSubtitle) return;
    
    this.setState({ isAnimatingSubtitle: true });
    
    const originalSubtitle = this.state.currentSubtitle;
    this.currentAnimationText = originalSubtitle;
    this.pendingNewSubtitle = null;
    
    // Phase 1: Backspace the current subtitle
    const backspaceInterval = 50; // ms between each character removal
    
    const backspace = () => {
      if (this.currentAnimationText.length > 0) {
        this.currentAnimationText = this.currentAnimationText.slice(0, -1);
        this.setState({ currentSubtitle: this.currentAnimationText });
        this.subtitleAnimationTimeout = setTimeout(backspace, backspaceInterval);
      } else {
        // Backspacing complete, check if we have a new subtitle ready
        if (this.pendingNewSubtitle) {
          this.startTypingNewSubtitle(this.pendingNewSubtitle);
        } else {
          // Wait for the new subtitle to arrive
          this.waitingForNewSubtitle = true;
        }
      }
    };
    
    // Start the backspace animation
    this.subtitleAnimationTimeout = setTimeout(backspace, backspaceInterval);
  }

  continueWithNewSubtitle(newSubtitle) {
    this.pendingNewSubtitle = newSubtitle;
    
    if (this.waitingForNewSubtitle) {
      // Backspacing is already complete, start typing immediately
      this.startTypingNewSubtitle(newSubtitle);
      this.waitingForNewSubtitle = false;
    }
    // If we're still backspacing, the new subtitle will be used once backspacing completes
  }

  startTypingNewSubtitle(newSubtitle) {
    const typeInterval = 80; // ms between each character addition
    let charIndex = 0;
    
    const typeNextChar = () => {
      if (charIndex < newSubtitle.length) {
        this.currentAnimationText = newSubtitle.slice(0, charIndex + 1);
        this.setState({ currentSubtitle: this.currentAnimationText });
        charIndex++;
        this.subtitleAnimationTimeout = setTimeout(typeNextChar, typeInterval);
      } else {
        // Animation complete
        this.setState({ isAnimatingSubtitle: false });
        this.waitingForNewSubtitle = false;
        this.pendingNewSubtitle = null;
      }
    };
    
    this.subtitleAnimationTimeout = setTimeout(typeNextChar, typeInterval);
  }

  animateSubtitleChange(newSubtitle) {
    if (this.state.isAnimatingSubtitle) return;
    
    this.setState({ isAnimatingSubtitle: true });
    
    const originalSubtitle = this.state.currentSubtitle;
    let currentText = originalSubtitle;
    
    // Phase 1: Backspace the current subtitle
    const backspaceInterval = 50; // ms between each character removal
    const typeInterval = 80; // ms between each character addition
    
    const backspace = () => {
      if (currentText.length > 0) {
        currentText = currentText.slice(0, -1);
        this.setState({ currentSubtitle: currentText });
        this.subtitleAnimationTimeout = setTimeout(backspace, backspaceInterval);
      } else {
        // Phase 2: Type the new subtitle
        let charIndex = 0;
        const typeNextChar = () => {
          if (charIndex < newSubtitle.length) {
            currentText = newSubtitle.slice(0, charIndex + 1);
            this.setState({ currentSubtitle: currentText });
            charIndex++;
            this.subtitleAnimationTimeout = setTimeout(typeNextChar, typeInterval);
          } else {
            // Animation complete
            this.setState({ isAnimatingSubtitle: false });
          }
        };
        this.subtitleAnimationTimeout = setTimeout(typeNextChar, typeInterval);
      }
    };
    
    // Start the backspace animation
    this.subtitleAnimationTimeout = setTimeout(backspace, backspaceInterval);
  }

  applyCustomCSS(cssString) {

    document.body.style.filter = '';

    // Add 'transition: all 1s ease;' to every block of CSS currently affecting the DOM from a stylesheet

    // Helper function to add transition to a CSSStyleRule
    function addTransitionToRule(rule) {
      try {
        // Only add if not already present
        if (!rule.style.transition || !rule.style.transition.includes('all 1s ease')) {
          rule.style.setProperty('transition', 'all 1s ease');
        }
      } catch (e) {
        // Some rules may be read-only or cross-origin, ignore those
      }
    }

    // Iterate over all stylesheets in the document
    for (let i = 0; i < document.styleSheets.length; i++) {
      const sheet = document.styleSheets[i];
      let rules;
      try {
        rules = sheet.cssRules || sheet.rules;
      } catch (e) {
        // Ignore cross-origin stylesheets
        continue;
      }
      if (!rules) continue;
      for (let j = 0; j < rules.length; j++) {
        const rule = rules[j];
        // Only process style rules (not @media, @font-face, etc.)
        if (rule.type === CSSRule.STYLE_RULE) {
          addTransitionToRule(rule);
        }
      }
    }

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

  dismissWelcomeBackModal() {
    // Update the server to mark that user has logged in since reboot
    fetch('/api/mark_logged_in_since_reboot?access_token=' + this.state.accessToken, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }).then(() => {
      this.setState({ showWelcomeBackModal: false });
    }).catch(error => {
      console.error('Failed to update login status:', error);
      // Still close the modal even if the API call fails
      this.setState({ showWelcomeBackModal: false });
    });
  }

  render() {
    return <div className="app">
      <div id='header'>
        <div className="header-content">
          <div className="header-title-section">
            <h1>reciprocity.pro</h1>
            <div className="subtitle header-subtitle">
              {this.state.currentSubtitle}
              {this.state.isAnimatingSubtitle && <span className="typing-cursor">|</span>}
            </div>
            {this.state.manifoldProbability !== null && (
              <div className="manifold-probability" style={{
                fontSize: '0.9em',
                color: '#666',
              }}>
                <a target="_blank" href="https://manifold.markets/Buck/dumb-feature-on-new-reciprocity-web">
                P(bad security decisions compromise privacy by EOY 2025) = {(this.state.manifoldProbability * 100).toFixed(1)}%</a>
              </div>
            )}
            <div className="header-privacy-link"><a href={'/privacy_policy.txt'}>privacy policy</a></div>
            
          </div>
          <div id='logout'>
            {this.state.myInfo &&
              <div>
                <button onClick={() => window.FB.logout(() => window.location.reload())} >
                  {this.state.isSmallMobile ? 'Logout' : 'Log out'}
                </button>
                {/*<Button onClick={() => this.deleteAccount()}>Delete account</Button>*/}
                <div className="signed-in-text">
                  <span className="highlight-color">
                    {this.state.isSmallMobile ? 'Signed in as' : 'Signed in as'}
                  </span>
                  <img 
                    height={this.state.isSmallMobile ? 20 : 25} 
                    width={this.state.isSmallMobile ? 20 : 25} 
                    alt={`Your profile pic`}
                    className="profile-image"
                    src={this.state.myProfilePicUrl}
                  />
                  {this.state.isSmallMobile ? 
                    this.state.myInfo.name.split(' ')[0] : 
                    this.state.myInfo.name
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </div>


      {!this.state.myInfo &&
        <div id='main'>
          <div className="landing-examples">
            <div className="example-section">
              <span className="example-label">You check boxes</span>

              <table className="friend-table">
                <thead>
                  <tr>
                    <td style={{paddingLeft: '20px'}}><h3>People</h3></td>
                    <ResponsiveHeaderCell 
                      fullText="Hang out sometime" 
                      abbreviation="Hang" 
                    />
                    <ResponsiveHeaderCell 
                      fullText="Go on a date or something" 
                      abbreviation="Date" 
                    />
                    <ResponsiveHeaderCell 
                      fullText="Lick feet" 
                      abbreviation="Feet" 
                    />
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div className="user-td">
                        <div>
                          <div className="name">Claire
                          </div>
                          <div className="bio">Married, poly. Berkeley-based. Interested in
                            low-commitment dates and flings. </div>
                        </div>
                      </div>
                    </td>
                    <td className="check-cell"><input type="checkbox"
                      checked={false} /></td>
                    <td className="check-cell"><input type="checkbox"
                      className="checkbox-server-checked" checked="true" /></td>
                    <td className="check-cell"><input type="checkbox"
                      className="checkbox-server-checked" checked="true" /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="example-section">
              <span className="example-label">Your friends check boxes</span>

              <table className="friend-table">
                <thead>
                  <tr>
                    <td style={{paddingLeft: '20px'}}><h3>People</h3></td>
                    <ResponsiveHeaderCell 
                      fullText="Hang out sometime" 
                      abbreviation="Hang" 
                    />
                    <ResponsiveHeaderCell 
                      fullText="Go on a date or something" 
                      abbreviation="Date" 
                    />
                    <ResponsiveHeaderCell 
                      fullText="Lick feet" 
                      abbreviation="Feet" 
                    />
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div className="user-td">
                        <div>
                          <div className="name">Buck</div>
                          <div className="bio">Friendly and pleasant, looking for cute dates!</div>
                        </div>
                      </div>
                    </td>
                    <td className="check-cell"><input type="checkbox"
                      checked={true} className="checkbox-server-checked" /></td>
                    <td className="check-cell"><input type="checkbox"
                      className="checkbox-server-checked" checked="true" /></td>
                    <td className="check-cell"><input type="checkbox"
                       checked={false} /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="example-section">
              <span className="example-label">You see when you've checked each other's boxes</span>

              <table className="friend-table">
                <thead>
                  <tr>
                    <td />
                    <ResponsiveHeaderCell 
                      fullText="Hang out sometime" 
                      abbreviation="Hang" 
                    />
                    <ResponsiveHeaderCell 
                      fullText="Go on a date or something" 
                      abbreviation="Date" 
                    />
                    <ResponsiveHeaderCell 
                      fullText="Lick feet" 
                      abbreviation="Feet" 
                    />
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div className="user-td">
                        <div>
                            <div className="name">Claire
                          </div>
                          <div className="bio">Married, poly. Berkeley-based. Interested in
                          low-commitment dates and flings.  </div>
                        </div>
                      </div>
                    </td>
                    <td className="check-cell"><input type="checkbox"
                      checked={false} /></td>
                    <td className="check-cell"><input type="checkbox"
                      className="checkbox-them-checked" checked="true" /></td>
                    <td className="check-cell"><input type="checkbox"
                      className="checkbox-server-checked" checked="true" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <button 
            disabled={this.state.loggingIn} 
            className={this.state.loggingIn ? "unhinged-login" : ""}
            onClick={() => {
              this.startHueAnimation();
              window.FB.login((resp) => this.handleFBLogin(resp), {scope: 'user_friends,email'});
            }}
          >
            {this.state.loggingIn ? "Logging in..." : "Log in with Facebook"}
          </button>
        </div>}
            
      {this.state.myInfo && <div>
        <div id='main'>
          <InstructionAccordion />
          
          <CustomAccordion style={{marginTop: '30px'}}>
            <CustomAccordionSummary 
              onClick={() => this.setState({userSettingsOpen: !this.state.userSettingsOpen})} 
              isOpen={this.state.userSettingsOpen}
            >
              User Settings
            </CustomAccordionSummary>
            <CustomAccordionDetails isOpen={this.state.userSettingsOpen}>
              <div style={{display: 'block'}}>
                              <div><h3 style={{fontSize: '1.1em'}}>Bio</h3>
                <div><small>e.g. 'I don't use this for dating, and I'm mostly looking for female friends'</small></div>
                <div><CustomTextField fullWidth multiline value={this.state.bioState || ""}
                                onChange={(e) => this.setState({bioState: e.target.value})}/></div>
                
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
                    <option value='invisible'>🙈 Invisible to everyone</option>
                    <option value='everyone'>🌐 Recommended: Visible to everyone on Reciprocity who has checked this option, and also my friends</option>
                    <option value='friends'>👥 Visible just to Reciprocity users who are my Facebook friends</option>
                  </select>
                </div>
                
                <CustomPopover
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
                    <div style={{fontSize: '14px'}}>
                      Facebook is unreliable about providing a full list of your friends. 
                      So if you choose the "visible just to reciprocity users who are my Facebook friends" option, 
                      you might not see some of your friends who have Reciprocity accounts, and they might also not see you.
                      The official recommendation of reciprocity.pro is to select the "visible to everyone" option.
                    </div>
                  </div>
                </CustomPopover>
              </div>
                
            {/* <div style={{paddingTop: '30px'}}>
              <div>
                <small>
                  By entering your number, you agree to receive text notifications when you match with someone.
                </small>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px'}}>
                <label style={{fontWeight: 'bold', fontSize: '1.1em'}}>Phone Number:</label>
                <CustomTextField
                  style={{width: '200px'}}
                  value={this.state.phoneNumberState !== undefined ? this.state.phoneNumberState : (this.state.myInfo.phone_number || "")}
                  onChange={(e) => this.setState({phoneNumberState: e.target.value})}
                  placeholder="Enter your phone number"
                  inputProps={{ maxLength: 20 }}
                />
              </div>
              <div style={{
                color: ((this.state.phoneNumberState !== undefined ? this.state.phoneNumberState : (this.state.myInfo.phone_number || "")).length > 20) ? "#d32f2f" : "#B6AAA2", 
                fontSize: "0.9em", 
                marginTop: '5px'
              }}>
                {(this.state.phoneNumberState !== undefined ? this.state.phoneNumberState : (this.state.myInfo.phone_number || "")).length}/20
              </div>
            </div> */}

            <div style={{paddingTop: '30px'}}>
              <div>
                <small>
                  Link to your dating doc or profile (optional).
                </small>
              </div>
              <div >
                <div><label style={{fontWeight: 'bold', fontSize: '1.1em'}}>Dating Doc Link:</label></div>
                <CustomTextField
                  style={{width: '300px'}}
                  value={this.state.datingDocLinkState !== undefined ? this.state.datingDocLinkState : (this.state.myInfo.dating_doc_link || "")}
                  onChange={(e) => this.setState({datingDocLinkState: e.target.value})}
                  placeholder="Enter URL (e.g., https://docs.google.com/...)"
                                      inputProps={{ maxLength: 200 }}
                />
              </div>
              <div style={{
                                    color: ((this.state.datingDocLinkState ? this.state.datingDocLinkState : (this.state.myInfo.dating_doc_link || "")).length > 200) ? "#d32f2f" : "#B6AAA2", 
                fontSize: "0.9em", 
                marginTop: '5px'
              }}>
                                  {(this.state.datingDocLinkState ? this.state.datingDocLinkState : (this.state.myInfo.dating_doc_link || "")).length}/200
              </div>
            </div>

            <div style={{paddingTop: '30px'}}>
              
              <div style={{marginTop: '10px'}}>
                <label style={{fontWeight: 'bold', fontSize: '1.1em'}}>Private Contact Info:</label>
                <div>
                <small>
                  This info will only be visible to people you've matched with. Great for sharing social media handles, other ways to reach you, etc.
                </small>
              </div>
                <CustomTextField
                  style={{
                    width: window.innerWidth < 600 ? '90%' : '400px'
                  }}
                  value={this.state.privateContactInfoState !== undefined ? this.state.privateContactInfoState : (this.state.myInfo.private_contact_info || "")}
                  onChange={(e) => this.setState({privateContactInfoState: e.target.value})}
                  placeholder="Email me at foo@bar.com or text at 123-456-7890"
                  inputProps={{ maxLength: 100 }}
                />
              </div>
              <div style={{
                color: ((this.state.privateContactInfoState !== undefined ? this.state.privateContactInfoState : (this.state.myInfo.private_contact_info || "")).length > 100) ? "#d32f2f" : "#B6AAA2", 
                fontSize: "0.9em", 
                marginTop: '5px'
              }}>
                {(this.state.privateContactInfoState !== undefined ? this.state.privateContactInfoState : (this.state.myInfo.private_contact_info || "")).length}/100
              </div>
            </div>

            {/* <div style={{paddingTop: '30px'}}>
              <div style={{display: 'flex', gap: '10px', marginTop: '1em'}}>
                <button
                  style={{marginTop: '1em', background: '#dc3545'}}
                  onClick={() => this.setState({customCssState: ""})}
                >
                  Clear custom style
                </button>
              </div>
            </div> */}

            <div style={{paddingTop: '30px', textAlign: 'center', borderTop: '1px solid #ddd', marginTop: '30px'}}>
              <button
                style={{fontSize: '1.1em', padding: '12px 30px'}}
                onClick={() => this.saveAllUserSettings()}
                disabled={!this.hasUserSettingsChanges()}
              >
                Save Changes
              </button>
            </div>
              </div>
            </CustomAccordionDetails>
          </CustomAccordion>
          
          <CustomAccordion style={{marginTop: '30px'}}>
            <CustomAccordionSummary
              onClick={() => this.setState({designAccordionOpen: !this.state.designAccordionOpen})}
              isOpen={this.state.designAccordionOpen}
            >
              Do you have a problem with the graphic design of this website?
            </CustomAccordionSummary>
            <CustomAccordionDetails isOpen={this.state.designAccordionOpen}>
              <div style={{display: 'block'}}>
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
                  disabled={this.state.isGeneratingCSS}
                  maxLength={200}
                  onKeyDown={(e) => {
                    if (
                      e.key === 'Enter' &&
                      !this.state.isGeneratingCSS &&
                      this.state.cssGenerationInstruction.trim() &&
                      this.state.cssGenerationInstruction.length <= 200
                    ) {
                      e.preventDefault();
                      this.generateCustomCSS();
                    }
                  }}
                />
                <div style={{
                  color: (this.state.cssGenerationInstruction || "").length > 200 ? "#d32f2f" : "#B6AAA2", 
                  fontSize: "0.9em"
                }}>
                  {(this.state.cssGenerationInstruction || "").length}/200
                </div>
                <div style={{display: 'flex', gap: '10px'}}>
                  <button
                    onClick={() => this.generateCustomCSS()}
                    disabled={this.state.isGeneratingCSS || !this.state.cssGenerationInstruction.trim() || this.state.cssGenerationInstruction.length > 200}
                    
                  >
                    {this.state.isGeneratingCSS ? 'redesigning...' : 'redesign website'}
                  </button>
                </div>
                
              </div>
                </div>
            </CustomAccordionDetails>
          </CustomAccordion>
          
          <div>
            {this.state.myVisibilitySetting == 'invisible' ? <p>Set your visibility to something other than 'invisible' in order to see people!
              <button onClick={() => this.updateVisibility('everyone')}>Set visibility to public</button>
            </p> :
            <FriendsListView
                visibilitySetting = {this.state.myVisibilitySetting}
                myChecks={this.state.myChecks}
                currentChecksState={this.state.currentChecksState}
                friendsList={this.state.friendsList}
                updateVisibility={(newVisibility) => this.updateVisibility(newVisibility)}
                reciprocations={Map(this.state.reciprocations).mapEntries(([idStr, x]) =>
                    [parseInt(idStr), Set(x)])}
                friendPictures={this.state.friendPictures}
                sendUpdateRequest={(myNewChecks) => this.sendUpdateRequest(myNewChecks)}
                setCheckedState={(id, activity, currChecked) => this.setCheckedState(id, activity, currChecked)}
            />}</div>

        </div>
        <div id='footer'>
          <button onClick={() => this.submit()}>
            Submit checks
          </button>

        

        </div>
      </div>}

            {/* Welcome Back Modal */}
      <CustomModal
        open={this.state.showWelcomeBackModal}
        onClose={() => this.dismissWelcomeBackModal()}
        title="Welcome back to Reciprocity!"
      >
        <div style={{lineHeight: '1.6'}}>
          <p style={{marginBottom: '16px'}}>
            👋 Hey there! We've made some changes since you last logged in.
          </p>
          <p style={{marginBottom: '16px'}}>
            Here's what's happening:
          </p>
          <ul style={{marginBottom: '20px', paddingLeft: '20px'}}>
            <li style={{marginBottom: '8px'}}>It's a new Reciprocity era, so I've removed all previous checks and user data.</li>
            <li style={{marginBottom: '8px'}}>I have made everyone's profiles private by default. So if you want other people to see you, or to see other people, you'll need to update this in your user settings.</li>
            <li style={{marginBottom: '8px'}}>Dating docs are now directly supported.</li>
            <li style={{marginBottom: '8px'}}>You can add private contact info to your profile that is visible only to people you've matched with.</li>
            <li style={{marginBottom: '8px'}}>I've hopefully found a permanent solution to people sending me suggestions for how the graphic design could be improved.</li>
          </ul>
          <p style={{marginBottom: '20px'}}>
            Thanks for being part of the Reciprocity community! 💕
          </p>
          <div style={{textAlign: 'center'}}>
            <button
              onClick={() => this.dismissWelcomeBackModal()}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                backgroundColor: '#886B7C',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      </CustomModal>
    </div>
  }

  async generateCustomCSS() {
    // Start backspacing immediately
    this.startSubtitleBackspace();
    
    fetch(`/api/generate_tagline?access_token=${this.state.accessToken}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instruction: this.state.cssGenerationInstruction
      })
    }).then(response => response.text())
        .then((data) => {
          console.log(data);
          // Continue with the new subtitle
          if (data && data.trim()) {
            this.continueWithNewSubtitle(data.trim());
          }
        });

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

          console.log(content);
          
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
          setTimeout(pollForUpdates, 600);
          
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
    })
    .then(response => {
      if (response.status === 401) {
        return response.json().then(errorData => {
          if (errorData.error === 'facebook_login_failed') {
            this.handleFacebookLogout();
            throw new Error(errorData.message || 'Facebook login failed');
          } else {
            throw new Error(errorData.message || 'Authentication failed');
          }
        });
      }
      return response.json();
    })
    .then((myInfo) => {
      this.setState({myInfo: myInfo});
      // Apply custom CSS if it was updated
      if (newInfo.custom_css !== undefined) {
        this.applyCustomCSS(myInfo.custom_css);
      }
    })
    .catch(error => {
      console.error('Update user info failed:', error);
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
    
    if (this.state.privateContactInfoState !== undefined && 
        this.state.privateContactInfoState !== (this.state.myInfo.private_contact_info || "")) {
      changes.private_contact_info = this.state.privateContactInfoState;
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
              if ((this.state.datingDocLinkState || "").length <= 200) {
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
    
    // Check if private contact info has changed
    if (this.state.privateContactInfoState !== undefined && 
        this.state.privateContactInfoState !== (this.state.myInfo.private_contact_info || "")) {
      // Also check if private contact info is within length limit
      if ((this.state.privateContactInfoState || "").length <= 1000) {
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
    })
    .then(response => {
      if (response.status === 401) {
        return response.json().then(errorData => {
          if (errorData.error === 'facebook_login_failed') {
            this.handleFacebookLogout();
            throw new Error(errorData.message || 'Facebook login failed');
          } else {
            throw new Error(errorData.message || 'Authentication failed');
          }
        });
      }
      return response.json();
    })
    .then(([myChecks, reciprocations]) => {
      this.setState({
        myChecks: Map(myChecks).mapEntries(([idStr, x]) =>
          [parseInt(idStr), Set(x)]), 
        reciprocations: reciprocations
      })
    })
    .catch(error => {
      console.error('Update checks failed:', error);
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
    })
    .then(response => {
      if (response.status === 401) {
        return response.json().then(errorData => {
          if (errorData.error === 'facebook_login_failed') {
            this.handleFacebookLogout();
            throw new Error(errorData.message || 'Facebook login failed');
          } else {
            throw new Error(errorData.message || 'Authentication failed');
          }
        });
      }
      return response.json();
    })
    .then(() => {
      this.fetchInfo();
    })
    .catch(error => {
      console.error('Update visibility failed:', error);
      this.setState({updatingVisibility: false});
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

  handleFacebookLogout() {
    // Clear the user's state
    this.setState({
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
      privateContactInfoState: undefined,
      nameFilter: '',
      updatingVisibility: false,
    });

    // Log out from Facebook if FB is available
    if (window.FB) {
      window.FB.logout((response) => {
        console.log('Facebook logout response:', response);
      });
    }

    // Remove any custom CSS
    this.removeCustomCSS();
    
    // Stop any animations
    this.stopHueAnimation();

    // Show a message to the user
    alert('Your login session has expired. Please log in again to continue.');
  }

  fetchInfo() {
    fetch('/api/info?access_token=' + this.state.accessToken)
      .then(response => {
        if (response.status === 401) {
          // Check for Facebook login failure
          return response.json().then(errorData => {
            if (errorData.error === 'facebook_login_failed') {
              // Facebook login failed - log out and let user try again
              console.log('Facebook login failed, logging out...');
              this.handleFacebookLogout();
              throw new Error(errorData.message || 'Facebook login failed');
            } else {
              throw new Error(errorData.message || 'Authentication failed');
            }
          });
        }
        return response.json();
      })
      .then(data => {
        let [myInfo, firstLogin, friendsList, friendPictures, myChecks, reciprocations, myProfilePicUrl] = data;
        const myVisibilitySetting = myInfo.visibility_setting;

        const myChecksParsed = Map(myChecks).mapEntries(([idStr, x]) =>
          [parseInt(idStr), Set(x)])

        // Check if we should show the welcome back modal
        const shouldShowWelcomeBackModal = firstLogin;

        this.setState({
          friendsList: friendsList,
          friendPictures: friendPictures,
          myInfo: myInfo,
          myChecks: myChecksParsed,
          currentChecksState: myChecksParsed,
          reciprocations: reciprocations,
          bioState: myInfo.bio,
          datingDocLinkState: myInfo.dating_doc_link,
          customCssState: myInfo.custom_css,
          privateContactInfoState: myInfo.private_contact_info,
          myProfilePicUrl: myProfilePicUrl,
          myVisibilitySetting: myVisibilitySetting,
          nameFilter: '',
          updatingVisibility: false,
          showWelcomeBackModal: shouldShowWelcomeBackModal,
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
          this.state.currentChecksState.update(id, Set(),
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
    
    // Sort friends by: 1) matched, 2) both bio & doc, 3) either, 4) neither
    const score = (f) => [
      this.props.reciprocations.get(f.id, Set()).size > 0 ? 3 : 0,
      (f.bio && f.bio.trim() && f.dating_doc_link && f.dating_doc_link.trim()) ? 2 :
        ((f.bio && f.bio.trim()) || (f.dating_doc_link && f.dating_doc_link.trim()) ? 1 : 0)
    ];
    const sortedFriends = filteredFriends.slice().sort((a, b) => {
      return score(b)[0] - score(a)[0] || score(b)[1] - score(a)[1];
    });
    // Apply pagination
    const friendsToShow = sortedFriends.slice(0, this.state.itemsToShow);
    const hasMoreItems = sortedFriends.length > this.state.itemsToShow;

    return (
        <div style={{ marginTop: '100px' }}>
          <div style={{marginLeft: '10px'}}>
            
          <h3>People</h3>
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
              </div>
          <table  className='friend-table'>
            <thead>
            <tr>
              <td style={{paddingLeft: '20px'}}>
              
              </td>
              
              <ResponsiveHeaderCell 
                fullText="Hang out sometime" 
                abbreviation="Hang" 
              />
              <ResponsiveHeaderCell 
                fullText="Go on a date or something" 
                abbreviation="Date" 
              />
              <ResponsiveHeaderCell 
                fullText="Lick feet" 
                abbreviation="Feet" 
              />
            </tr>
            </thead>
            <tbody>
            {friendsToShow.map((friend, idx) => this.renderFriendRow(friend, idx))}
            </tbody>
          </table>
          
          {hasMoreItems && (
            <div style={{textAlign: 'center', margin: '20px 0'}}>
              <button 
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
              </button>
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
    
    return <tr key={idx}>
      <td>
        <div className='user-td'>
          <div>
            <span className='name'>
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
                  title="Open date me doc"
                >
                  🔗
                </span>
              )}
            </span>&nbsp;
            <span className='bio'>{(bio || "").split(" ")
                .map((part, idx) =>
                  urlRegex.test(part) ? <a key={idx} href={part}>{part} </a> : part + " "
                )}</span>
            
            {/* Show private contact info if user has matched with this friend */}
            {friend.private_contact_info && this.props.reciprocations.get(id, Set()).size > 0 && (
              <div className="private-contact-info">
                <strong>Contact info:</strong> {friend.private_contact_info}
              </div>
            )}
          </div>

        </div>
      </td>
      {['hangOut', 'date', 'lickFeet'].map((activity, idx) => {
        const themChecked = this.props.reciprocations.get(id, Set()).includes(activity);
        const serverChecked = this.props.myChecks.get(id, Set()).includes(activity);
        const currentStateChecked = currentChecksState.get(id, Set()).includes(activity);
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
