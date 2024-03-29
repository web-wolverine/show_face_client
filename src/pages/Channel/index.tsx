import React from 'react';

import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import WebrtcConnection from '../../lib/webrtc';

import { socket } from '../../lib/sockets';
import socketActions from '../../lib/sockets/socketActions';

import styles from './channel_page.style';

import MessagesList from '../../components/MessagesList';
import ChatInput from '../../components/ChatInput';

import { messagesApi } from '../../api';

const defaultVideos: string[] = [];

class Channel extends React.Component<any, any> {
    Connection: any = null;
    localUserMediaRef: any = React.createRef()
    localRemoteUserMediaRef: any = React.createRef()

    state = {
        videos: defaultVideos,
        connected: false,
        iceCandidate: null,
        messages: [],
    }

    async componentDidMount() {
        const userId = this.props.user.id;
        const channelId = this.props.match.params.channelId;

        socket.emit(socketActions.channel_connect, {
            channelId: this.props.match.params.channelId,
            clientId: this.props.user.id
        });

        this.Connection = new WebrtcConnection({
            clientId: userId,
            channelId,
            onCandidateConnect: this.onCandidateConnect,
            onClientConnect: this.onClientConnect,
        })

        this.getMessages();

        this.Connection.init();
    }

    getMessages = async () => {
        try {
            const channelId = this.props.match.params.channelId;

            const { data } = await messagesApi.findByChannelId(channelId)

            this.setState({
                messages: data.rows
            })
        } catch (error) {

        }
    }

    onChannelDisconnected = (client: any) => {
        console.log('client', client);
    }

    handleDisconnect = () => {
        this.Connection.endCall();

        socket.emit(socketActions.channel_disconnect, {
            channelId: this.props.match.params.channelId,
            clientId: this.props.user.id
        });

        this.setState({
            connected: false
        })
    };

    handleConnect = async () => {
        this.Connection.createConnect();


        this.setState({
            connected: true
        })
    };

    onCandidateConnect = (stream: any) => {

        if (this.localRemoteUserMediaRef.current) {

            this.localRemoteUserMediaRef.current.srcObject = stream;

        }

    };

    onClientConnect = (stream: any) => {

        if (this.localUserMediaRef.current) {

            this.localUserMediaRef.current.srcObject = stream;

        }

    };
    onMessage = async (message: string) => {
        const channelId = this.props.match.params.channelId;

        const values = {
            message
        };

        try {
            const result = await messagesApi.createByChannelId(channelId, values);

            this.getMessages();
        } catch (error) {
            // TODO: 
        }

    }
    render() {

        const classes = this.props.classes;

        return (
            <Grid item xs={12}>
                <Grid container justify="center" spacing={6}>

                    <Grid xs={8} item>

                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                Local
                                <video
                                    key="selfview"
                                    autoPlay={true}
                                    muted={true}
                                    playsInline={true}
                                    ref={this.localUserMediaRef}
                                    style={{
                                        width: '100%',
                                        height: 'auto',
                                    }}
                                />
                            </Grid>

                            <Grid item xs={6}>
                                Remote
                                <video
                                    key="remoteview"
                                    autoPlay={true}
                                    muted={true}
                                    playsInline={true}
                                    ref={this.localRemoteUserMediaRef}
                                    style={{
                                        width: '100%',
                                        height: 'auto',
                                    }}
                                />
                            </Grid>

                        </Grid>
                    </Grid>

                    <Grid xs={4} item>

                        <div>
                            <Button
                                fullWidth
                                variant="contained"
                                className={classes.button}
                                onClick={this.handleConnect}
                            >Connect</Button>

                            <Button
                                fullWidth
                                variant="contained"
                                className={classes.button}
                                onClick={this.handleDisconnect}
                            >disconnect</Button>

                        </div>

                        <Paper elevation={2} style={{ padding: 20 }}>
                            <MessagesList messages={this.state.messages} />
                            <ChatInput onSubmit={this.onMessage} />
                        </Paper>

                    </Grid>
                </Grid>
            </Grid>
        )
    }
}

const storeStateToProps = ({ appStore }: any) => ({ user: appStore.user });

export default compose(
    connect(storeStateToProps, null),
    withStyles(styles),
    withRouter
)(Channel);