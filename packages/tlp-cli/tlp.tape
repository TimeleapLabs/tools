# timeleap-wizard.tape

Output demo.gif
Set FontSize 46
Set Width 1200
Set Height 600

# Start wizard
Type "bun run index.ts init"
Enter

# Wait for welcome message
Wait /Timeleap Wizard/

# Wait for "Where should we init your nodes?"
Wait /Where should we init your nodes\?/
Type "./my-node"
Enter

# Wait for role selection
Wait /Select the roles you'd like to install/
# "worker" is selected by default, so add broker
Down
Space
Enter

# Wait for secrets generation
Wait /Generating secrets/
Sleep 2s  # wait for docker run
Wait /created/  # wait for secrets.yaml log

# Wait for config & compose
Wait /Generating config/
Sleep 1s

# Wait for next steps
Wait /Next steps/
Sleep 500ms

# End
Wait /You are ready to use Timeleap/
Sleep 2s
