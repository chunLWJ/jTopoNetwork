/**
 * 获取系统路径
 * @type {{getRootPath: SysUtil.getRootPath}}
 */
var SysUtil = {
    getRootPath: function () {
        // 获取当前网址，如： http://localhost:8083/uimcardprj/share/meun.jsp
        var curWwwPath = window.document.location.href
        // 获取主机地址之后的目录，如： uimcardprj/share/meun.jsp
        var pathName = window.document.location.pathname
        var pos = curWwwPath.indexOf(pathName, 7)
        // 获取主机地址，如： http://localhost:8083
        var localhostPath = curWwwPath.substring(0, pos)
        // 获取带"/"的项目名，如：/uimcardprj
        var projectName = pathName.substring(0, pathName.substr(1).indexOf('/') + 2)
        return localhostPath + projectName
    }
}
// url根路径
var rootPath = SysUtil.getRootPath()
var topoImgPath = './img/'

/*
 * 生成uuid算法,碰撞率低于1/2^^122
 * @param x 0-9或a-f范围内的一个32位十六进制数
 */
function generateUUID() {
    var d = new Date().getTime()
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0
        d = Math.floor(d / 16)
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
    })
    return uuid
}

/**
 * 计算程序执行时间
 * @type {{startTime: {}, timeSpan: number, start: Timer.start, stop: Timer.stop, getTimeSpan: Timer.getTimeSpan}}
 */
var Timer = {
    startTime: {},
    stoppedStatus: true,
    start: function () {
        if (this.stoppedStatus) {
            this.startTime = new Date()
            this.stoppedStatus = false
        }
    },
    pause: function () {
        var startTime = this.startTime
        if (startTime) {
            return new Date() - startTime
        } else {
            return -1
        }
    },
    stop: function () {
        var startTime = this.startTime
        if (startTime) {
            this.stoppedStatus = true
            return new Date() - startTime
        } else {
            this.stoppedStatus = true
            return -1
        }
    }
}

let images = [
    './img/icon_fair.png',
    './img/icon_firewall.png',
    './img/icon_proxy_server.png',
]
/**
 * 节点类型，可以得到一些关于节点的东西
 * jTopoNodeName 是 初始化 node 的函数名
 * toggleModal 是 对应 编辑框 的 模态窗口
 * formNamePrefix: 对应前缀
 * formNameEditArr: 对应编辑的选项，一般是指我们让他编辑的属性值，这些属性值都会直接赋值到对应的node节点上，所以命名一定不要出错！！
 * nodeInit: 节点初始化函数，一般是一些节点需要设置一些方法，或者我们自定义的一些节点，逻辑一般都在里面
 */
var typeMap = new Map([
        [
            'text', {
                jTopoNodeName: 'TextNode',
                toggleModal: () => $('#text_edit').modal('toggle'),
                prefix: 'text_edit_',
                formNameEditArr: ['text', 'fontColor'], // 对应需要编辑的选项
            }
        ],
        [
            'image', {
                jTopoNodeName: 'Node',
                toggleModal: () => $('#image_edit').modal('toggle'),
                prefix: 'image_edit_',
                formNameEditArr: ['alpha'], // 对应需要编辑的选项
                nodeInit: function (node) {
                    node.setImage(node.__src)
                }
            }
        ],
        [
            'interface', {
                jTopoNodeName: 'Node',
                toggleModal: () => $('#interface_edit').modal('toggle'),
                prefix: 'interface_edit_',
                formNameEditArr: [], // 对应需要编辑的选项
                nodeInit: function (node) {
                    node.setImage(images[Math.floor(Math.random() * images.length)])
                }
            }
        ],
        [
            'shape', {
                jTopoNodeName: 'Node',
                toggleModal: () => $('#shape_edit').modal('toggle'),
                prefix: 'shape_edit_',
                formNameEditArr: [], // 对应需要编辑的选项
                nodeInit: function (node) {
                    node.zIndex = -1
                    // if (node.__selectShape === 'rect') {
                    //     node.showSelected = false
                    // }
                    node.paint = function(g) {
                        g.save()
                        g.beginPath()
                        let rgba = `rgba(${node.__color.colorRgb()},${node.__opacity})`
                        g.strokeStyle = rgba
                        if (node.__dashed) {
                            let x = node.__dashedLength || 3;
                            g.setLineDash([x,x * 2])
                        }
                        if (node.__selectShape === 'circle')
                            gCircle(g,node)
                        else if (node.__selectShape === 'rect'){
                            gRect(g,node)
                        }

                        g.stroke()
                        g.closePath()
                        g.restore()

                        // this.paintText(g);
                    }
                }
            }
        ],
    ]
)

function gCircle(g,node){
    let minRadius = node.width >= node.height ? node.height : node.width
    g.arc(0, 0, minRadius / 2,0, Math.PI*2);
}
function gRect(g,node){
    g.translate(-node.width / 2, -node.height / 2)
    g.strokeRect(0,0,node.width,node.height)
}

var prefixSelectVariable = (prefix, str) => str.indexOf(prefix) === 0 ? str.slice(prefix.length) : undefined

/**
 * 返回已 __ 开头的 属性值
 * @param obj {Object}
 * @return {{}}
 */
function getStart__Obj(obj) {
    let __obj = {}
    for (const objKey in obj) {
        if (objKey.startsWith('__'))
            __obj[objKey] = obj[objKey]
    }
    return __obj
}
