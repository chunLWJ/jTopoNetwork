/// 删减掉 jtopo-editor 一些不必要的功能

/**
 * 基于jtopo-editor.js的二次封装
 * designed by wenyuan
 * github: https://github.com/winyuan/jtopo_topology
 */

/**
 * 提供拓扑图面板相关操作的函数集，编辑器继承其全部功能
 */
function TopologyPanel() {
}

/**
 * 保存序列化的拓扑图JSON数据到服务器
 */
TopologyPanel.prototype.saveTopology = function (url) {
    editor.mainMenu.hide()
    let self = this
    // 保存container状态
    let containers = editor.utils.getContainers()
    for (let c = 0; c < containers.length; c++) {
        let temp = []
        let nodes = containers[c].childs
        for (let n = 0; n < nodes.length; n++) {
            if (nodes[n] instanceof JTopo.Node) {
                temp.push(nodes[n].nodeId)
            }
        }
        containers[c].childNodes = temp.join(',')
    }
    alert(editor.stage.toJson())
}

/**
 * 重置拓扑图
 */
TopologyPanel.prototype.resetTopology = function (url) {
    editor.stageMode = 'edit'
    // this.replaceStage(url)
}

/**
 * 加载指定id的拓扑图JSON数据结构
 * @param topologyGuid 拓扑 表记录ID
 * @param backImg 拓扑图的背景图片
 */
TopologyPanel.prototype.loadTopology = function (url, topologyGuid, backImg) {
    $.ajax({
        type: 'GET',
        url: url,
        async: false,
        contentType: 'application/json',
        dataType: 'json',
        error: function () {
            // alert('服务器异常，请稍后重试..')
        },
        success: function (response) {
            // 错误处理
            if (response.code !== 200) {
                console.error(response.msg)
            } else if (response.code === 200 && $.isEmptyObject(response.data.topology_json)) {
                // 拓扑不存在,创建一个空白的拓扑图
                let initTopologyJson = {
                    'version': '0.4.8',
                    'wheelZoom': 0.95,
                    'width': 972,
                    'height': 569,
                    'id': 'ST172.19.105.52015100809430700001',
                    'childs': [
                        {
                            'elementType': 'scene',
                            'id': 'S172.19.105.52015100809430700002',
                            'translateX': -121.82,
                            'translateY': 306.72,
                            'scaleX': 1.26,
                            'scaleY': 1.26,
                            'childs': []
                        }
                    ]
                }
                editor.init(topologyGuid, backImg, initTopologyJson, '')
            } else {
                // 拓扑存在,渲染拓扑图
                let topologyJson = response.data.topology_json
                editor.init(topologyGuid, backImg, topologyJson, '')
            }
        }
    })
}

/**
 * 传入JSON形式的拓扑图数据,绘制拓扑图。如果数据结构不正确,返回空拓扑图
 * @param topologyJson json形式的拓扑结构数据
 * @param backImg 拓扑图的背景图片
 */
TopologyPanel.prototype.loadTopologyByJson = function (topologyJson, backImg) {
    try {
        JTopo.replaceStageWithJson(topologyJson)
        if (editor.stage && editor.scene && editor.scene.childs && editor.scene.childs.length > 0) {
            editor.stage.centerAndZoom()
        }
    } catch (e) {
        console.error(e)
        let initTopologyJson = {
            'version': '0.4.8',
            'wheelZoom': 0.95,
            'width': 972,
            'height': 569,
            'id': 'ST172.19.105.52015100809430700001',
            'childs': [
                {
                    'elementType': 'scene',
                    'id': 'S172.19.105.52015100809430700002',
                    'translateX': -121.82,
                    'translateY': 306.72,
                    'scaleX': 1.26,
                    'scaleY': 1.26,
                    'childs': []
                }
            ]
        }
        JTopo.replaceStageWithJson(initTopologyJson)
        if (editor.stage && editor.scene && editor.scene.childs && editor.scene.childs.length > 0) {
            editor.stage.centerAndZoom()
        }
    }
}

/**
 * 清空所有节点
 */
TopologyPanel.prototype.deleteAllNodes = function () {
    editor.stage.childs.forEach(function (s) {
        s.clear()
    })
    // 连线重置
    editor.beginNode = null
    editor.link = null
}









