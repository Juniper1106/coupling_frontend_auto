import { Badge } from "antd";
import "./AIAvatar.scss"
import avatarImg from "@ui/assets/img/avatar.png"
 
function AIAvatar() {
    return (
    <div className="avatarContainer">
        <img className="avatar" src={avatarImg} alt="" />
        <Badge status="processing" text="AI's current action" />
        <Badge status="default" text="AI's intention" />
    </div>
    );
}

export default AIAvatar;